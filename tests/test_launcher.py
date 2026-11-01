"""Small tests for the one-action DEMKit launcher (no services started)."""

import importlib.util
from pathlib import Path
import socket
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "launch_demkit.py"
spec = importlib.util.spec_from_file_location("launch_demkit", SCRIPT)
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
    def test_open_port_is_detected(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
            server.bind(("127.0.0.1", 0))
            server.listen()
            self.assertTrue(launcher.port_is_open(server.getsockname()[1]))

    def test_http_200_is_ready_for_both_services(self):
        response = SimpleNamespace(status=200)
        with patch.object(launcher, "urlopen") as open_url:
            open_url.return_value.__enter__.return_value = response
            self.assertTrue(launcher.http_ready(3001, backend=True))
            self.assertTrue(launcher.http_ready(3002, backend=False))

    def test_backend_404_is_not_a_web_homepage(self):
        error = HTTPError("http://127.0.0.1/", 404, "Not Found", {}, None)
        with patch.object(launcher, "urlopen", side_effect=error):
            self.assertTrue(launcher.http_ready(3001, backend=True))
            self.assertFalse(launcher.http_ready(3002, backend=False))

    def test_exited_backend_is_detected_immediately(self):
        stopped = SimpleNamespace(poll=lambda: 1, returncode=1)
        with self.assertRaisesRegex(RuntimeError, "exited before it was ready"):
            launcher.wait_for_http("DEMKit", 3001, stopped, backend=True)


if __name__ == "__main__":
    unittest.main()
