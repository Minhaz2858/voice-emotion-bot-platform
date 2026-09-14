"""Voice Emotion Bot Platform — launcher / mode picker.

Serves the landing page that lists the available voice chat modes and links
each one to its deployment. The launcher itself is stateless and needs no
provider credentials: every link target is read from the environment so the
same image can front a local dev stack or a production deployment.

Environment variables (see .env.example):
    MODE_VOICE_ONLY_URL        voice-only mode (Next.js app, default :3000)
    MODE_ABSTRACT_URL          abstract mode   (Next.js app, default :3002)
    MODE_CARTOONISH_URL        optional external agent, empty = no link
    MODE_HUMAN_REALISTIC_URL   optional external agent, empty = no link
    PORT                       launcher port (default 5001)
"""

import os

from flask import Flask, render_template

app = Flask(__name__)

# Mode -> deployment URL. Empty values render the card without a target so the
# template never has to change when a mode is added or removed.
URLS = {
    "voice_bot": os.environ.get("MODE_VOICE_ONLY_URL", "http://localhost:3000"),
    "abstract": os.environ.get("MODE_ABSTRACT_URL", "http://localhost:3002"),
    "cartoonish_mode": os.environ.get("MODE_CARTOONISH_URL", ""),
    "human_realistic_voice_bot": os.environ.get("MODE_HUMAN_REALISTIC_URL", ""),
}


@app.route("/")
def landing():
    return render_template("index.html", urls=URLS)


@app.route("/healthz")
def healthz():
    """Liveness probe for container/orchestrator health checks."""
    return {"status": "ok", "modes": {k: bool(v) for k, v in URLS.items()}}


if __name__ == "__main__":
    app.run(
        debug=os.environ.get("FLASK_DEBUG", "0") == "1",
        port=int(os.environ.get("PORT", 5001)),
    )
