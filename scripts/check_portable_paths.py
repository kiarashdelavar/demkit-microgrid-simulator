"""Quick check for paths in the tracked DEMKit config template.

This does not start the simulation. It copies only the public template
into two temporary project folders and checks the four generated paths.
Run from the repository root with:
    .\\.venv\\Scripts\\python.exe .\\scripts\\check_portable_paths.py
"""

from pathlib import Path
import runpy
import shutil
import tempfile

TEMPLATE = Path(__file__).resolve().parents[1] / "demkittt" / "conf" / "usrconf.example.py"


def check_location(root: Path) -> None:
    config_dir = root / "demkittt" / "conf"
    config_dir.mkdir(parents=True)
    config = config_dir / "usrconf.py"
    shutil.copyfile(TEMPLATE, config)

    settings = runpy.run_path(str(config))
    expected_components = (root / "demkittt" / "components").resolve().as_posix() + "/"
    expected_workspace = (root / "workspace").resolve().as_posix() + "/"

    assert settings["componentPath"] == expected_components
    assert settings["workspacePath"] == expected_workspace
    assert settings["demCfg"]["env"]["path"] == expected_components
    assert settings["demCfg"]["workspace"]["path"] == expected_workspace
    print("PASS:", root)


if __name__ == "__main__":
    with tempfile.TemporaryDirectory(prefix="demkit path test ") as directory:
        temporary_root = Path(directory)
        check_location(temporary_root / "first location")
        check_location(temporary_root / "second location with spaces")
    print("Both portable configuration checks passed.")
