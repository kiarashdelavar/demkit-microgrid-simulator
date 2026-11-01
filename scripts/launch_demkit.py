"""Start DEMKit and its Node.js web interface from one command.

The launcher is for an already-installed development checkout. It uses only
the Python standard library and does not install or update dependencies.
"""

from __future__ import annotations

import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
import webbrowser


ROOT = Path(__file__).resolve().parents[1]
BACKEND_SCRIPT = ROOT / "demkittt" / "demkit.py"
USER_CONFIG = ROOT / "demkittt" / "conf" / "usrconf.py"
MODEL_DIR = ROOT / "workspace" / "touchtable" / "model"
WEB_DIR = ROOT / "workspace" / "touchtable" / "web"
WEB_SCRIPT = WEB_DIR / "index.js"
STARTUP_TIMEOUT_SECONDS = 90


class LauncherError(RuntimeError):
    """An expected failure with a short message and a useful next step."""

    def __init__(self, code: str, message: str, next_step: str):
        super().__init__(message)
        self.code = code
        self.next_step = next_step


def read_ports() -> tuple[int, int]:
    try:
        backend_port = int(os.environ.get("DEM_PORT", "3001"))
        web_port = int(os.environ.get("PORT", "3002"))
    except ValueError:
        raise LauncherError(
            "INVALID_PORT", "DEM_PORT and PORT must be numbers.",
            "Remove invalid environment overrides, or set DEM_PORT=3001 and PORT=3002."
        ) from None

    if not (1 <= backend_port <= 65535 and 1 <= web_port <= 65535):
        raise LauncherError(
            "INVALID_PORT", "The configured port is outside the allowed range.",
            "Use port numbers between 1 and 65535."
        )
    if backend_port == web_port:
        raise LauncherError(
            "SAME_PORT", "Python and Node.js cannot use the same port.",
            "Use different values for DEM_PORT and PORT (normally 3001 and 3002)."
        )
    return backend_port, web_port


def check_requirements() -> str:
    """Report missing installation files before starting either process."""
    if not BACKEND_SCRIPT.is_file() or not MODEL_DIR.is_dir():
        raise LauncherError(
            "MISSING_PROJECT", "The DEMKit backend or model folder is missing.",
            "Open the complete repository checkout, including demkittt and workspace."
        )
    if not USER_CONFIG.is_file():
        raise LauncherError(
            "MISSING_CONFIG", "The local Python configuration file is missing.",
            "Copy demkittt/conf/usrconf.example.py to demkittt/conf/usrconf.py."
        )
    if not WEB_SCRIPT.is_file():
        raise LauncherError(
            "MISSING_WEB", "The Node.js web server file is missing.",
            "Check that workspace/touchtable/web/index.js exists."
        )
    if not (WEB_DIR / "node_modules").is_dir():
        raise LauncherError(
            "MISSING_NPM", "Node.js packages have not been installed.",
            "Open workspace/touchtable/web and run npm ci."
        )
    node = shutil.which("node")
    if not node:
        raise LauncherError(
            "MISSING_NODE", "Node.js could not be found.",
            "Install Node.js and restart the terminal so node is available on PATH."
        )
    return node


def port_is_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
        return False


def check_ports(backend_port: int, web_port: int) -> None:
    busy = []
    for name, port in (("Python DEMKit", backend_port), ("Node.js", web_port)):
        if port_is_open(port):
            busy.append(f"{name} ({port})")
    if busy:
        raise LauncherError(
            "PORT_IN_USE", "Port already occupied: " + ", ".join(busy) + ".",
            "Close the old DEMKit Python and Node.js windows before launching again. "
            "Do not stop unrelated processes."
        )


def http_ready(port: int, *, backend: bool) -> bool:
    """Check HTTP readiness; Eve may respond 404 to GET /."""
    try:
        with urlopen(f"http://127.0.0.1:{port}/", timeout=1) as response:
            return 200 <= response.status < 500 if backend else response.status == 200
    except HTTPError as error:
        return backend and 400 <= error.code < 500
    except (URLError, OSError, TimeoutError):
        return False


def wait_for_http(name: str, port: int, process: subprocess.Popen, backend: bool) -> None:
    deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        if process.poll() is not None:
            step = (
                "Check the Python error above, especially demkittt/conf/usrconf.py. "
                "Try starting demkittt/demkit.py manually if needed."
                if backend else
                "Check the Node.js error above and run npm ci in workspace/touchtable/web."
            )
            raise LauncherError(
                "BACKEND_EXITED" if backend else "WEB_EXITED",
                f"{name} stopped before startup finished (exit code {process.returncode}).",
                step
            )
        if http_ready(port, backend=backend):
            print(f"[Launcher] {name} is responding on port {port}.", flush=True)
            return
        time.sleep(0.5)

    raise LauncherError(
        "BACKEND_TIMEOUT" if backend else "WEB_TIMEOUT",
        f"{name} did not respond on port {port} within {STARTUP_TIMEOUT_SECONDS} seconds.",
        "Review the server output above for configuration errors or a blocked port. "
        "Try starting that service manually to see the full error."
    )


def stop_started_processes(processes: list[subprocess.Popen]) -> None:
    """Best-effort cleanup of direct child processes; BK-09 will extend this."""
    for process in reversed(processes):
        if process.poll() is None:
            process.terminate()
    for process in reversed(processes):
        if process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


def run(check_only: bool = False) -> int:
    children: list[subprocess.Popen] = []
    try:
        backend_port, web_port = read_ports()
        node = check_requirements()
        check_ports(backend_port, web_port)

        if check_only:
            print("[Launcher] Checks passed. Python config, Node.js and ports look ready.", flush=True)
            print("[Launcher] No services were started (--check).", flush=True)
            return 0

        env = os.environ.copy()
        env.setdefault("DEM_HOST", "127.0.0.1")
        print(f"[Launcher] Project: {ROOT}", flush=True)
        print("[Launcher] Starting Python DEMKit...", flush=True)
        backend = subprocess.Popen(
            [sys.executable, "-u", str(BACKEND_SCRIPT), "-f", "touchtable/model", "-m", "touchtable"],
            cwd=str(ROOT),
            env=env,
        )
        children.append(backend)
        wait_for_http("Python DEMKit", backend_port, backend, backend=True)

        print("[Launcher] Starting Node.js...", flush=True)
        frontend = subprocess.Popen(
            [node, str(WEB_SCRIPT)],
            cwd=str(WEB_DIR),
            env=env,
        )
        children.append(frontend)
        wait_for_http("Node.js web server", web_port, frontend, backend=False)

        address = f"http://localhost:{web_port}"
        print(f"[Launcher] Ready. Opening {address}", flush=True)
        if not webbrowser.open(address):
            print(f"[Launcher] Open this address in your browser: {address}", flush=True)
        print("[Launcher] Keep this window open. Press Ctrl+C to stop.", flush=True)
        while True:
            for name, process in (("Python DEMKit", backend), ("Node.js", frontend)):
                if process.poll() is not None:
                    raise LauncherError(
                        "SERVICE_STOPPED", f"{name} stopped (exit code {process.returncode}).",
                        "Review the service output above and restart the launcher."
                    )
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[Launcher] Stopping DEMKit and Node.js...", flush=True)
        return 0
    except LauncherError as error:
        print(f"[Launcher] {error.code}: {error}", file=sys.stderr, flush=True)
        print(f"[Launcher] Next step: {error.next_step}", file=sys.stderr, flush=True)
        return 1
    except OSError:
        print("[Launcher] PROCESS_ERROR: Could not start or stop a service.", file=sys.stderr, flush=True)
        print("[Launcher] Next step: Check Python/Node.js installation and file permissions.",
              file=sys.stderr, flush=True)
        return 1
    finally:
        stop_started_processes(children)


if __name__ == "__main__":
    if sys.argv[1:] not in ([], ["--check"]):
        print("Usage: python scripts/launch_demkit.py [--check]", file=sys.stderr)
        sys.exit(2)
    sys.exit(run(check_only=(sys.argv[1:] == ["--check"])))
