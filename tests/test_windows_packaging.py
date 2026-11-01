"""Offline checks for Windows packaging preparation. No installer is built."""

import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_windows_prototype.py"
spec = importlib.util.spec_from_file_location("demkit_windows_build", SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class WindowsPackagingTests(unittest.TestCase):
    def test_filter_excludes_secrets_and_generated_python_files(self):
        ignored = builder.ignore_files(".", [
            "usrconf.py", ".env", ".env.local", "var",
            "model.pyc", "keep.py", "node_modules",
        ])
        self.assertTrue({"usrconf.py", ".env", ".env.local", "var",
                         "model.pyc", "node_modules"} <= ignored)
        self.assertNotIn("keep.py", ignored)

    def test_nested_node_modules_are_preserved(self):
        ignored = builder.ignore_package_cache(".", [
            "node_modules", "express", "__pycache__", "info.log",
        ])
        self.assertNotIn("node_modules", ignored)
        self.assertNotIn("express", ignored)
        self.assertIn("__pycache__", ignored)

    def test_runtime_staging_includes_data_and_no_local_credentials(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            dem = root / "demkittt"
            (dem / "conf").mkdir(parents=True)
            (dem / "components").mkdir()
            (dem / "LICENSE.pdf").write_bytes(b"license")
            (dem / "conf" / "usrconf.example.py").write_text("cfgVer = 3\n")
            (dem / "conf" / "usrconf.py").write_text("password='secret'\n")
            model = root / "workspace" / "touchtable" / "model"
            model.mkdir(parents=True)
            (model / "LICENSE.pdf").write_bytes(b"model license")
            (model / "touchtable.py").write_text("pass\n")
            web = root / "workspace" / "touchtable" / "web"
            (web / "static").mkdir(parents=True)
            (web / "static" / "index.html").write_text("<html></html>")
            (web / "node_modules" / "some-module" / "node_modules" / "nested").mkdir(parents=True)
            (web / "node_modules" / "some-module" / "index.js").write_text("ok")
            (web / "index.js").write_text("module.exports = {};\n")
            (web / "package.json").write_text("{}\n")
            staging = root / "build" / "runtime"
            with patch.object(builder, "ROOT", root):
                with patch.object(builder, "WEB_SRC", web):
                    with patch.object(builder, "RUNTIME", staging):
                        builder.prepare_runtime()

            packaged = staging / "demkittt" / "conf" / "usrconf.py"
            self.assertEqual(packaged.read_text(), "cfgVer = 3\n")
            self.assertNotIn("secret", packaged.read_text())
            self.assertTrue((staging / "workspace" / "touchtable" / "model"
                             / "touchtable.py").exists())
            self.assertTrue((staging / "workspace" / "touchtable" / "web"
                             / "node_modules" / "some-module" / "node_modules"
                             / "nested").is_dir())


if __name__ == "__main__":
    unittest.main()
