"""PyInstaller entry point for the existing DEMKit model.

The installed Electron app sets DEMKIT_RUNTIME_ROOT to a writable copy of
the packaged DEMKit and workspace files. Never package local usrconf.py.
"""
import os
from pathlib import Path
import runpy
import sys


def configure_import_paths(root: Path) -> None:
    """Make the dynamically loaded DEMKit code importable when frozen.

    The model imports modules two ways:
      - from hosts.touchtable... (demkittt/components on sys.path)
      - from components.ctrl... (demkittt itself on sys.path)
    PyInstaller does not automatically add the runtime working directory.
    """
    for location in (
        root / "demkittt",
        root / "demkittt" / "components",
        root / "workspace" / "touchtable" / "model",
    ):
        path = str(location)
        if path not in sys.path:
            sys.path.insert(0, path)


def main():
    raw = os.environ.get("DEMKIT_RUNTIME_ROOT")
    if not raw:
        raise SystemExit("DEMKIT_RUNTIME_ROOT was not provided by the desktop launcher.")

    root = Path(raw).resolve()
    script = root / "demkittt" / "demkit.py"
    components = root / "demkittt" / "components"
    model = root / "workspace" / "touchtable" / "model"
    config = root / "demkittt" / "conf" / "usrconf.py"
    for name, location in (("backend", script), ("components", components),
                           ("model", model), ("configuration", config)):
        if not location.exists():
            raise SystemExit(f"Missing packaged {name}. Reinstall the prototype.")

    # DEMKit dynamically loads source files and composes a model at runtime.
    # These directories are writable user-data copies, not files inside asar.
    configure_import_paths(root)
    os.chdir(str(root / "demkittt"))
    sys.argv = [str(script), "-f", "touchtable/model", "-m", "touchtable"]
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
