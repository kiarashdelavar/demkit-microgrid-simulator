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
            if ($exitCode -ne 0) {
                Write-Host 'This can mean vulnerabilities were found, or the registry was unreachable. Inspect the JSON; do not assume either.'
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
    if ($exitCode -eq 0 -or $exitCode -eq 1) {
        Write-Host "pip-audit exit code $exitCode. Result (if saved): $jsonFile"
    } else {
        Write-Warning "pip-audit could not run (exit $exitCode). Check whether it is installed in .venv: .\.venv\Scripts\python.exe -m pip install pip-audit"
    }
} else {
    Write-Warning 'Python virtual environment not found. Skip until .venv is set up.'
}

Write-Host ''
Write-Host "Reports are local only: $outDir"
Write-Host 'Review results before sharing. Do not commit raw audit output, credentials or paths.'
Write-Host 'Do not run npm audit fix, pip-audit --fix or automatic upgrades during this baseline.'
