"""Tests for the DEMKit launcher; no actual servers or browsers are started."""

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

    def test_backend_exit_provides_a_next_step(self):
        stopped = SimpleNamespace(poll=lambda: 1, returncode=1)
        with self.assertRaises(launcher.LauncherError) as failure:
            launcher.wait_for_http("Python DEMKit", 3001, stopped, backend=True)
        self.assertEqual(failure.exception.code, "BACKEND_EXITED")
        self.assertIn("usrconf.py", failure.exception.next_step)

    def test_web_exit_provides_a_next_step(self):
        stopped = SimpleNamespace(poll=lambda: 1, returncode=1)
        with self.assertRaises(launcher.LauncherError) as failure:
            launcher.wait_for_http("Node.js web server", 3002, stopped, backend=False)
        self.assertEqual(failure.exception.code, "WEB_EXITED")
        self.assertIn("npm ci", failure.exception.next_step)

    def test_backend_timeout_has_clear_error(self):
        running = SimpleNamespace(poll=lambda: None, returncode=None)
        with patch.object(launcher, "STARTUP_TIMEOUT_SECONDS", 0):
            with self.assertRaises(launcher.LauncherError) as failure:
                launcher.wait_for_http("Python DEMKit", 3001, running, backend=True)
        self.assertEqual(failure.exception.code, "BACKEND_TIMEOUT")

    def test_invalid_ports_are_rejected(self):
        with patch.dict(launcher.os.environ, {"DEM_PORT": "not-a-port"}):
            with self.assertRaises(launcher.LauncherError) as failure:
                launcher.read_ports()
        self.assertEqual(failure.exception.code, "INVALID_PORT")

    def test_same_port_is_rejected(self):
        with patch.dict(launcher.os.environ, {"DEM_PORT": "3001", "PORT": "3001"}):
            with self.assertRaises(launcher.LauncherError) as failure:
                launcher.read_ports()
        self.assertEqual(failure.exception.code, "SAME_PORT")

    def test_occupied_backend_port_is_reported(self):
        with patch.object(launcher, "port_is_open", side_effect=lambda port: port == 3001):
            with self.assertRaises(launcher.LauncherError) as failure:
                launcher.check_ports(3001, 3002)
        self.assertEqual(failure.exception.code, "PORT_IN_USE")
        self.assertIn("3001", str(failure.exception))

    def test_missing_config_explains_how_to_fix_it(self):
        missing = Path(__file__).parent / "missing-usrconf-for-test.py"
        with patch.object(launcher, "USER_CONFIG", missing):
            with self.assertRaises(launcher.LauncherError) as failure:
                launcher.check_requirements()
        self.assertEqual(failure.exception.code, "MISSING_CONFIG")
        self.assertIn("usrconf.example.py", failure.exception.next_step)

    def test_missing_node_packages_has_npm_instruction(self):
        with patch.object(launcher, "USER_CONFIG", Path(__file__)):
            with patch.object(launcher, "WEB_DIR", Path(__file__).parent):
                with self.assertRaises(launcher.LauncherError) as failure:
                    launcher.check_requirements()
        self.assertEqual(failure.exception.code, "MISSING_NPM")
        self.assertIn("npm ci", failure.exception.next_step)

    def test_node_not_on_path_is_reported(self):
        with patch.object(launcher, "USER_CONFIG", Path(__file__)):
            with patch.object(launcher, "WEB_DIR", Path(__file__).parent):
                # Simulate packages being available without touching the real filesystem.
                with patch.object(Path, "is_dir", return_value=True):
                    with patch.object(launcher.shutil, "which", return_value=None):
                        with self.assertRaises(launcher.LauncherError) as failure:
                            launcher.check_requirements()
        self.assertEqual(failure.exception.code, "MISSING_NODE")

    def test_check_only_does_not_start_processes(self):
        with patch.object(launcher, "check_requirements", return_value="node"):
            with patch.object(launcher, "check_ports") as check_ports:
                with patch.object(launcher.subprocess, "Popen") as start:
                    self.assertEqual(launcher.run(check_only=True), 0)
                    start.assert_not_called()
                    check_ports.assert_called_once()

    def test_check_mode_reports_occupied_port(self):
        with patch.object(launcher, "check_requirements", return_value="node"):
            with patch.object(launcher, "port_is_open", return_value=True):
                self.assertEqual(launcher.run(check_only=True), 1)


if __name__ == "__main__":
    unittest.main()
