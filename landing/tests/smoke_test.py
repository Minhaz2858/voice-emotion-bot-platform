"""Smoke test for the launcher: renders the mode picker and the health probe."""
import re
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

import app as launcher  # noqa: E402

client = launcher.app.test_client()

page = client.get("/")
assert page.status_code == 200, page.status_code
body = page.data.decode()
assert "prompt-cards" in body, "mode picker did not render"
assert re.search(r"href=\"http", body), "no mode link rendered"

health = client.get("/healthz")
assert health.status_code == 200, health.status_code
payload = health.get_json()
assert payload["status"] == "ok"
assert set(payload["modes"]) == {
    "voice_bot",
    "abstract",
    "cartoonish_mode",
    "human_realistic_voice_bot",
}

print("launcher smoke test OK ->", page.status_code, health.get_json())
