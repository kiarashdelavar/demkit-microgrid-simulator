r"""Build a *local, internal* Windows Electron + PyInstaller prototype.

Run from the repo root with:
    .\.venv\Scripts\python.exe scripts\build_windows_prototype.py

Do not publish installers until rights holders approve redistribution.
"""
from pathlib import Path
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]
WIN = ROOT / "packaging" / "windows"
STAGING = WIN / ".build"
DIST = WIN / "dist"
RUNTIME = STAGING / "runtime"
WEB_SRC = ROOT / "workspace" / "touchtable" / "web"
ELECTRON = WIN / "electron"
EXCLUDED = {"__pycache__", ".git", ".venv", "node_modules", "var", "stats", "cache"}
INSTALLER_FILENAME = re.compile(
    r"DEMKit Microgrid(?: Prototype)? Setup \d+\.\d+\.\d+[-+\w.]*\.exe"
)


def ignore_files(directory: str, names: list[str]) -> set[str]:
    blocked = set()
    for name in names:
        if name in EXCLUDED or name.endswith((".pyc", ".pyo", ".log", ".bak")):
            blocked.add(name)
        if name in {".env", "usrconf.py", "usrconf_new.py"} or name.startswith(".env."):
            blocked.add(name)
    return blocked


def ignore_package_cache(directory: str, names: list[str]) -> set[str]:
    # Nested node_modules folders are required for module resolution. Never
    # remove them when copying the installed Node dependency tree.
    return {
        name for name in names
        if name in {"__pycache__", ".git"} or name.endswith((".log", ".bak"))
    }


def prepare_runtime() -> None:
    if not (WEB_SRC / "node_modules").is_dir():
        raise RuntimeError("Run npm ci in workspace/touchtable/web before packaging.")
    if RUNTIME.exists():
        shutil.rmtree(RUNTIME)

    for source, target in (
        (ROOT / "demkittt", RUNTIME / "demkittt"),
        (ROOT / "workspace" / "touchtable" / "model",
         RUNTIME / "workspace" / "touchtable" / "model"),
        (WEB_SRC / "static",
         RUNTIME / "workspace" / "touchtable" / "web" / "static"),
    ):
        shutil.copytree(source, target, ignore=ignore_files)

    staged_web = RUNTIME / "workspace" / "touchtable" / "web"
    for filename in ("index.js", "package.json", "demkitHttpClient.js"):
        shutil.copy2(WEB_SRC / filename, staged_web / filename)
    shutil.copytree(WEB_SRC / "node_modules", staged_web / "node_modules",
                    ignore=ignore_package_cache)
    config_dir = RUNTIME / "demkittt" / "conf"
    shutil.copy2(config_dir / "usrconf.example.py", config_dir / "usrconf.py")

    # Licences stay with the copied upstream code and model; no local secrets.
    assert (RUNTIME / "demkittt" / "LICENSE.pdf").is_file()
    assert (RUNTIME / "workspace" / "touchtable" / "model" / "LICENSE.pdf").is_file()
    print("[Build] Prepared runtime files with a fresh template configuration.", flush=True)


def build_python_backend() -> None:
    try:
        import PyInstaller  # noqa: F401
    except ImportError as exc:
        raise RuntimeError(
            "Install PyInstaller in .venv first: python -m pip install pyinstaller"
        ) from exc

    # The inherited DEMKit model imports Python source dynamically. The following
    # explicitly exposes the packages used by those modules to PyInstaller.
    # This first pass needs runtime verification; do not treat a build as a pass.
    modules = (
        "flask", "eve", "flask_cors", "flask_httpauth", "requests",
        "pytz", "astral", "numpy", "pandas", "pymongo",
        "pymodbus", "zmq", "bs4", "cerberus", "simplejson",
    )
    command = [
        sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean",
        "--onedir", "--name", "demkit-backend",
        "--distpath", str(STAGING), "--workpath", str(STAGING / "pyinstaller-work"),
        "--specpath", str(STAGING),
        "--paths", str(ROOT / "demkittt" / "components"),
        "--paths", str(ROOT / "workspace" / "touchtable" / "model"),
    ]
    for module in modules:
        command.extend(("--hidden-import", module))
    command.extend(("--collect-submodules", "pymodbus"))
    command.append(str(WIN / "backend_entry.py"))
    subprocess.run(command, cwd=str(ROOT), check=True)
    if not (STAGING / "demkit-backend" / "demkit-backend.exe").is_file():
        raise RuntimeError("PyInstaller did not produce demkit-backend.exe")


def publish_installer(output: Path) -> Path:
    installers = [path for path in output.glob("*.exe") if path.is_file()]
    if len(installers) != 1 or installers[0].stat().st_size == 0:
        raise RuntimeError("Expected exactly one non-empty Windows installer from Electron.")

    DIST.mkdir(exist_ok=True)
    installer = installers[0]
    destination = installer.replace(DIST / installer.name)

    # Keep prior builds until the new installer has been generated and moved.
    for artifact in DIST.iterdir():
        if artifact == destination:
            continue
        if artifact.name == "win-unpacked" and artifact.is_dir() and not artifact.is_symlink():
            shutil.rmtree(artifact)
        elif artifact.is_file() and (
            artifact.name in {"builder-debug.yml", "builder-effective-config.yaml"}
            or INSTALLER_FILENAME.fullmatch(artifact.name.removesuffix(".blockmap"))
        ):
            artifact.unlink()
    return destination


def build_electron_installer() -> Path:
    # npm install generates the lockfile on the first build; afterwards npm ci
    # uses it so repeated local builds can be reproduced.
    npm = shutil.which("npm.cmd") or shutil.which("npm")
    npx = shutil.which("npx.cmd") or shutil.which("npx")
    if not npm or not npx:
        raise RuntimeError("Node.js/npm not found. Node is needed on the BUILD machine.")
    lock = ELECTRON / "package-lock.json"
    subprocess.run([npm, "ci" if lock.is_file() else "install"],
                   cwd=str(ELECTRON), check=True)
    with TemporaryDirectory(prefix="installer-", dir=STAGING) as output:
        subprocess.run([npx, "electron-builder", "--win", "nsis", "--x64",
                        "--publish", "never", f"-c.directories.output={output}"],
                       cwd=str(ELECTRON), check=True)
        return publish_installer(Path(output))


def main() -> int:
    if sys.platform != "win32":
        print("This prototype must be built on Windows; no cross-compile claim.", file=sys.stderr)
        return 1
    try:
        STAGING.mkdir(parents=True, exist_ok=True)
        prepare_runtime()
        build_python_backend()
        installer = build_electron_installer()
        print(f"[Build] Windows installer saved to {installer.relative_to(ROOT)}.", flush=True)
        print("[Build] NOT verified on a clean machine; do not publish yet.", flush=True)
        return 0
    except (RuntimeError, subprocess.CalledProcessError, OSError) as error:
        print(f"[Build] Failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
