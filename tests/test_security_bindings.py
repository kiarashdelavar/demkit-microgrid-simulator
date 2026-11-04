"""Small regression checks for the local-only bind settings.

These inspect source defaults. They do NOT replace running listener checks on
Windows or security testing of the HTTP and WebSocket APIs.
"""
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class SecurityBindingTests(unittest.TestCase):
    def test_demkit_rest_defaults_to_loopback(self):
        source = (ROOT / "demkittt" / "components" / "api" / "eveApi.py").read_text(encoding="utf-8")
        self.assertIn('os.environ.get("DEMKIT_API_HOST", "127.0.0.1")', source)
        self.assertIn("self.app.run(port=self.port, host=bind_host", source)
        self.assertNotIn("self.app.run(port=self.port, host='0.0.0.0'", source)

    def test_node_server_defaults_to_loopback(self):
        source = (ROOT / "workspace" / "touchtable" / "web" / "index.js").read_text(encoding="utf-8")
        self.assertIn("process.env.WEB_HOST || '127.0.0.1'", source)
        self.assertIn("http.listen(PORT, WEB_HOST", source)

    def test_desktop_launcher_pins_python_api_to_loopback(self):
        source = (ROOT / "packaging" / "windows" / "electron" / "main.js").read_text(encoding="utf-8")
        self.assertIn('DEMKIT_API_HOST: "127.0.0.1"', source)
        self.assertIn('process.env.WEB_HOST = "127.0.0.1"', source)

    def test_development_launcher_pins_both_services(self):
        source = (ROOT / "scripts" / "launch_demkit.py").read_text(encoding="utf-8")
        self.assertIn('env.setdefault("DEMKIT_API_HOST", "127.0.0.1")', source)
        self.assertIn('env.setdefault("WEB_HOST", "127.0.0.1")', source)


    def test_python_requirements_include_patched_certifi(self):
        """The Windows PyInstaller build uses requirements from this file."""
        requirements = (ROOT / "requirements.txt").read_text(encoding="utf-8")
        self.assertIn("certifi>=2026.10.19", requirements)


if __name__ == "__main__":
    unittest.main()
