# Read-only dependency audit for the local DEMKit checkout.
# Does not upgrade packages or modify either simulation or installer source.
# Run from PowerShell in the repository: .\scripts\run_security_audit.ps1

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outDir = Join-Path $root 'security-audit-local'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
if (-not $npm) {
    Write-Warning 'npm.cmd was not found. Install Node.js on this development machine before auditing npm packages.'
} else {
    function Invoke-ReadOnlyNpmAudit {
        param([string]$ProjectDir, [string]$Label)
        $lock = Join-Path $ProjectDir 'package-lock.json'
        if (-not (Test-Path $lock)) {
            Write-Warning "${Label}: package-lock.json is not tracked/present. Reproducible audit is blocked until a lockfile is reviewed and added."
            return
        }
        $jsonFile = Join-Path $outDir "$Label-npm-audit.json"
        Write-Host "Auditing $Label (read-only)..."
        Push-Location $ProjectDir
        try {
            $oldPreference = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try {
                & $npm.Source audit --json 1> $jsonFile
                $exitCode = $LASTEXITCODE
            } finally {
                $ErrorActionPreference = $oldPreference
            }
            Write-Host "${Label}: npm audit exit code $exitCode. Result: $jsonFile"
            # npm audit may exit 1 when it finds advisories. Read the report
            # before deciding whether the command failed or found vulnerabilities.
            if (Test-Path $jsonFile) {
                try {
                    $report = Get-Content -Path $jsonFile -Raw | ConvertFrom-Json
                    if ($report.error) {
                        Write-Warning ("${Label}: npm audit returned an error: " + $report.error.code)
                    } elseif ($report.metadata -and $report.metadata.vulnerabilities) {
                        $v = $report.metadata.vulnerabilities
                        Write-Host ("${Label}: Critical={0}, High={1}, Moderate={2}, Low={3}, Info={4}, Total={5}" -f $v.critical, $v.high, $v.moderate, $v.low, $v.info, $v.total)
                        if ($report.vulnerabilities) {
                            $top = @($report.vulnerabilities.PSObject.Properties |
                                Where-Object { $_.Value.severity -in @('critical', 'high') } |
                                Select-Object -First 12 |
                                ForEach-Object { "$($_.Name) ($($_.Value.severity))" })
                            if ($top.Count -gt 0) {
                                Write-Host ("${Label}: High/critical packages (first 12): " + ($top -join ', '))
                            }
                        }
                    } else {
                        Write-Warning "${Label}: No vulnerability summary found; inspect the JSON report for the error or report format."
                    }
                } catch {
                    Write-Warning "${Label}: Could not parse npm audit JSON: $($_.Exception.Message)"
                }
            }
            if ($exitCode -ne 0) {
                Write-Host 'Non-zero exit may mean advisories or an audit error. Check the JSON summary above.'
            }
        } finally {
            Pop-Location
        }
    }

    Invoke-ReadOnlyNpmAudit -ProjectDir (Join-Path $root 'workspace\touchtable\web') -Label 'web'
    Invoke-ReadOnlyNpmAudit -ProjectDir (Join-Path $root 'packaging\windows\electron') -Label 'electron-build'
}

$python = Join-Path $root '.venv\Scripts\python.exe'
if (Test-Path $python) {
    # Check installation first. Python also exits 1 for 'No module named
    # pip_audit', so exit code 1 alone must NOT be treated as an audit result.
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $python -m pip show pip-audit 1> $null 2> $null
        $available = ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $oldPreference
    }
    if (-not $available) {
        Write-Warning 'pip-audit is not installed in .venv. Install the audit tool with: .\.venv\Scripts\python.exe -m pip install pip-audit'
        Write-Warning 'Python dependency audit NOT RUN; no Python vulnerability result exists yet.'
    } else {
        $jsonFile = Join-Path $outDir 'python-pip-audit.json'
        Write-Host 'Auditing the current project Python virtual environment (read-only)...'
        $oldPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            & $python -m pip_audit --local --format json --output $jsonFile
            $exitCode = $LASTEXITCODE
        } finally {
            $ErrorActionPreference = $oldPreference
        }
        if (Test-Path $jsonFile) {
            Write-Host "pip-audit exit code $exitCode. Report: $jsonFile"
            try {
                $report = Get-Content -Path $jsonFile -Raw | ConvertFrom-Json
                if ($report.dependencies) {
                    $affected = @($report.dependencies | Where-Object { $_.vulns -and $_.vulns.Count -gt 0 })
                    Write-Host ("Python: {0} affected installed packages (individual advisories may be more)." -f $affected.Count)
                } else {
                    Write-Host 'Python: Review JSON for dependencies and vulnerability details.'
                }
            } catch {
                Write-Warning "Could not parse Python report: $($_.Exception.Message)"
            }
        } else {
            Write-Warning "pip-audit exited $exitCode but did not create a JSON report. Check output and network access."
        }
    }
} else {
    Write-Warning 'Python virtual environment not found. Skip until .venv is set up.'
}

Write-Host ''
Write-Host "Reports are local only: $outDir"
Write-Host 'Review results before sharing. Do not commit raw audit output, credentials or paths.'
Write-Host 'Do not run npm audit fix, pip-audit --fix or automatic upgrades during this baseline.'
