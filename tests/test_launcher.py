"""Tests for the DEMKit launcher; no actual servers or browsers are started."""

import importlib.util
from pathlib import Path
import socket
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch
import subprocess
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

    def test_windows_child_uses_separate_process_group(self):
        with patch.object(launcher.os, "name", "nt"):
            with patch.object(launcher.subprocess, "CREATE_NEW_PROCESS_GROUP", 0x200, create=True):
                with patch.object(launcher.subprocess, "Popen") as launch:
                    launcher.start_child(["node"], SCRIPT.parent, {})
        self.assertEqual(launch.call_args.kwargs["creationflags"], 0x200)

    def test_linux_child_uses_own_session(self):
        with patch.object(launcher.os, "name", "posix"):
            with patch.object(launcher.subprocess, "Popen") as launch:
                launcher.start_child(["python"], SCRIPT.parent, {})
        self.assertTrue(launch.call_args.kwargs["start_new_session"])

    def test_windows_break_sent_only_to_owned_child(self):
        child = Mock()
        child.pid = 3456
        child.poll.return_value = None
        with patch.object(launcher.os, "name", "nt"):
            with patch.object(launcher.signal, "CTRL_BREAK_EVENT", 1, create=True):
                launcher.request_stop(child)
        child.send_signal.assert_called_once_with(1)

    def test_stopped_child_is_not_signalled_again(self):
        child = Mock()
        child.poll.return_value = 0
        launcher.request_stop(child)
        child.send_signal.assert_not_called()

    def test_force_stop_targets_owned_windows_pid(self):
        child = Mock()
        child.pid = 4567
        child.poll.return_value = None
        with patch.object(launcher.os, "name", "nt"):
            with patch.object(launcher.subprocess, "run") as command:
                launcher.force_stop(child)
        self.assertEqual(
            command.call_args.args[0],
            ["taskkill", "/PID", "4567", "/T", "/F"],
        )
        self.assertNotIn("/IM", command.call_args.args[0])

    def test_shutdown_uses_fallback_for_unresponsive_child(self):
        child = Mock()
        child.pid = 5678
        child.poll.return_value = None
        child.wait.side_effect = subprocess.TimeoutExpired("fake", 1)
        with patch.object(launcher, "request_stop") as request:
            with patch.object(launcher, "force_stop") as force:
                launcher.stop_started_processes([child])
        request.assert_called_once_with(child)
        force.assert_called_once_with(child)

    def test_shutdown_skips_force_when_child_exits(self):
        child = Mock()
        child.pid = 6789
        child.poll.side_effect = [None, 0]
        child.wait.return_value = 0
        with patch.object(launcher, "request_stop") as request:
            with patch.object(launcher, "force_stop") as force:
                launcher.stop_started_processes([child])
        request.assert_called_once_with(child)
        force.assert_not_called()

    def test_remaining_port_is_reported(self):
        with patch.object(launcher, "PORT_RELEASE_TIMEOUT_SECONDS", 0):
            with patch.object(launcher, "port_is_open", side_effect=lambda port: port == 3002):
                result = launcher.wait_for_ports_released((3001, 3002))
        self.assertEqual(result, [3002])

    def test_closed_ports_allow_restart(self):
        with patch.object(launcher, "port_is_open", return_value=False):
            self.assertEqual(launcher.wait_for_ports_released((3001, 3002)), [])
            launcher.check_ports(3001, 3002)

    def test_partial_startup_failure_cleans_up_owned_backend(self):
        fake_backend = Mock()
        fake_backend.pid = 321
        fake_backend.poll.return_value = None
        fake_backend.returncode = None
        with patch.object(launcher, "check_requirements", return_value="node"):
            with patch.object(launcher, "check_ports"):
                with patch.object(launcher, "start_child", return_value=fake_backend):
                    with patch.object(launcher, "wait_for_http", side_effect=launcher.LauncherError(
                        "BACKEND_EXITED", "backend unavailable", "check config"
                    )):
                        with patch.object(launcher, "stop_started_processes") as stop:
                            with patch.object(launcher, "wait_for_ports_released", return_value=[]):
                                self.assertEqual(launcher.run(), 1)
        stop.assert_called_once_with([fake_backend])


if __name__ == "__main__":
    unittest.main()
