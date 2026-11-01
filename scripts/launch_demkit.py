"""Start the DEMKit simulation and Node.js web server together.

Development launcher for an existing local setup. It does not install Python,
Node.js, or project dependencies. Later tasks will improve diagnostics and
fully validate shutdown and restart behavior.
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
WEB_DIR = ROOT / "workspace" / "touchtable" / "web"
WEB_SCRIPT = WEB_DIR / "index.js"
STARTUP_TIMEOUT_SECONDS = 90


def port_is_open(port: int) -> bool:
    """Check a loopback port without starting any services."""
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
        return False


def http_ready(port: int, *, backend: bool) -> bool:
    """Check whether the intended HTTP service responds on its port.

    Eve may return HTTP 404 for '/', which still confirms its HTTP listener
    is accepting requests. The browser homepage must return HTTP 200.
    """
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
            raise RuntimeError(f"{name} exited before it was ready (code {process.returncode}).")
        if http_ready(port, backend=backend):
            print(f"[Launcher] {name} is responding on port {port}.", flush=True)
            return
        time.sleep(0.5)
    raise RuntimeError(f"{name} did not respond on port {port} in {STARTUP_TIMEOUT_SECONDS} seconds.")


def stop_started_processes(processes: list[subprocess.Popen]) -> None:
    """Best-effort cleanup of only the processes started by this launcher."""
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


def run() -> int:
    children: list[subprocess.Popen] = []
    try:
        backend_port = int(os.environ.get("DEM_PORT", "3001"))
        web_port = int(os.environ.get("PORT", "3002"))
        if not (1 <= backend_port <= 65535 and 1 <= web_port <= 65535):
            raise RuntimeError("Both ports must be between 1 and 65535.")
        if backend_port == web_port:
            raise RuntimeError("Python and Node.js cannot use the same port.")

        if not BACKEND_SCRIPT.is_file():
            raise RuntimeError(f"Python backend not found: {BACKEND_SCRIPT}")
        if not USER_CONFIG.is_file():
            raise RuntimeError("Missing demkittt/conf/usrconf.py. See docs/CONFIGURATION_GUIDE.md.")
        if not WEB_SCRIPT.is_file() or not (WEB_DIR / "node_modules").is_dir():
            raise RuntimeError("Node.js files missing. Run npm ci in workspace/touchtable/web.")

        node = shutil.which("node")
        if node is None:
            raise RuntimeError("Node.js was not found on PATH. Install Node.js first.")

        # Never connect to an old copy of the simulation without noticing.
        occupied = [port for port in (backend_port, web_port) if port_is_open(port)]
        if occupied:
            raise RuntimeError(
                "Port(s) already in use: " + ", ".join(map(str, occupied))
                + ". Close any old DEMKit Python/Node.js windows before starting."
            )

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
        print("[Launcher] Keep this window open. Press Ctrl+C to stop the two services.", flush=True)
        while True:
            for name, process in (("Python DEMKit", backend), ("Node.js", frontend)):
                if process.poll() is not None:
                    raise RuntimeError(f"{name} stopped (code {process.returncode}).")
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[Launcher] Stopping DEMKit and Node.js...", flush=True)
        return 0
    except (OSError, RuntimeError, ValueError) as error:
        print(f"[Launcher] Could not start or continue: {error}", file=sys.stderr, flush=True)
        return 1
    finally:
        stop_started_processes(children)


if __name__ == "__main__":
    sys.exit(run())
