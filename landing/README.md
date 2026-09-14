# Landing launcher

Flask app that serves the mode picker for the platform. It is deliberately
credential-free: it only links to the voice apps, so it can be deployed
anywhere and pointed at whatever deployments you run.

## Run

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # then edit the mode URLs
flask --app app run --port 5001
```

Open <http://localhost:5001>.

## Mode URLs

| Env var | Card | Default |
|---|---|---|
| `MODE_VOICE_ONLY_URL` | Voice Only | `http://localhost:3000` |
| `MODE_ABSTRACT_URL` | Abstract | `http://localhost:3002` |
| `MODE_CARTOONISH_URL` | Cartoonish Mode | *(unset — card renders without a link)* |
| `MODE_HUMAN_REALISTIC_URL` | Human-Realistic Mode | *(unset)* |

## Files

- `app.py` — routes (`/`, `/healthz`) and the mode URL table.
- `templates/index.html` — mode picker UI.
- `static/` — launcher styles/scripts/assets.

## Production

`Procfile` targets gunicorn (`web: gunicorn app:app`) with a Python 3.10
runtime pinned in `runtime.txt`.
