# Voice Emotion Bot Platform

[![CI](https://github.com/Minhaz2858/voice-emotion-bot-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Minhaz2858/voice-emotion-bot-platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A voice-first conversational agent platform: a Flask launcher that hosts multiple
voice chat modes, backed by two Next.js applications that handle real-time
speech-to-text, LLM reply generation, and low-latency text-to-speech with a
reactive audio visualisation.

> Status: reference implementation / research prototype. The platform is
> self-hosted and provider-agnostic by design — every cloud provider it talks to
> is behind a server-side proxy route, so keys never reach the browser and any
> provider can be swapped out.

---

## What is in this repository

| Component | Path | Runtime | Role |
|---|---|---|---|
| Launcher | `landing/` | Flask (Python 3.10+) | Landing page that lists the available voice chat modes and links to each deployment |
| Voice Only mode | `apps/voice-only/` | Next.js 14 | Minimal, low-chrome voice conversation: Web Speech STT → LLM → ElevenLabs TTS |
| Abstract mode | `apps/abstract/` | Next.js 14 | Same pipeline with a 3D "glow sphere" visualisation that reacts to speech intensity; Azure Speech TTS + optional Whisper STT backend |
| Documentation | `docs/` | — | Full system design, user flow, component and algorithm documentation |

### Voice chat modes

The launcher exposes four modes. Two are implemented in this repository; two are
integrations you point at your own deployments:

| Mode | Implementation | Default URL |
|---|---|---|
| Voice Only | `apps/voice-only` (in repo) | `http://localhost:3000` |
| Abstract | `apps/abstract` (in repo) | `http://localhost:3002` |
| Cartoonish Mode | external — set `MODE_CARTOONISH_URL` | not set |
| Human-Realistic Mode | external — set `MODE_HUMAN_REALISTIC_URL` | not set |

Modes whose environment variable is empty are rendered but link nowhere, so you
can wire in your own agents without touching the template.

---

## Architecture

```
                    ┌──────────────────────────────┐
   browser  ───────▶│  landing/  (Flask launcher)  │
                    │  GET /  →  mode picker       │
                    └──────────────┬───────────────┘
                                   │  links to each mode
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
  ┌────────────────────────┐                 ┌────────────────────────┐
  │ apps/voice-only        │                 │ apps/abstract          │
  │  (Next.js 14)          │                 │  (Next.js 14)          │
  │                        │                 │  + 3D glow sphere      │
  │  mic ──▶ Web Speech STT│                 │  mic ──▶ Web Speech /  │
  │            │           │                 │          Whisper STT   │
  │            ▼           │                 │            │           │
  │   /api/generate-reply  │                 │   /api/generate-reply  │
  │        │  (server)     │                 │        │  (server)     │
  │        ▼               │                 │        ▼               │
  │    LLM provider        │                 │    LLM provider        │
  │        │               │                 │        │               │
  │        ▼               │                 │        ▼               │
  │   /api/*-tts (server)  │                 │   /api/azure-tts       │
  │        │               │                 │        │ (server)      │
  │        ▼               │                 │        ▼               │
  │  ElevenLabs TTS        │                 │  Azure Speech TTS      │
  └────────────────────────┘                 └────────────────────────┘
```

Everything that touches a provider credential runs inside a Next.js route
handler (`app/api/**/route.ts`) or the local Whisper FastAPI service — the
browser only ever sees synthesized audio and plain text.

---

## Quickstart

### 1. Launcher (Flask)

```bash
cd landing
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional: edit the mode URLs
flask --app app run --port 5001
```

Open <http://localhost:5001>.

### 2. Voice apps (Next.js)

Run each one in its own terminal:

```bash
cd apps/voice-only
cp .env.example .env.local      # add your keys (never commit this)
npm install
npm run dev                     # http://localhost:3000
```

```bash
cd apps/abstract
cp .env.example .env.local
npm install
npm run dev -- --port 3002      # http://localhost:3002
```

Grant microphone permission when the browser asks. Conversation starts
automatically on page load; the app detects end-of-speech, transcribes, asks the
LLM for a short reply, and speaks it back.

### 3. Optional: local Whisper STT (no cloud STT)

`apps/*/scripts/whisper-stt/` contains a FastAPI wrapper around
`openai-whisper` for fully local transcription:

```bash
cd apps/voice-only/scripts/whisper-stt
./install.sh          # creates a venv and installs torch + whisper
./run.sh              # serves /transcribe on localhost:8001
```

Then point the app at it and enable the Whisper path in the UI.

---

## Environment variables

All credentials are **server-side only** — never prefix them with `NEXT_PUBLIC_`.

| Variable | Used by | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | both apps | Reply generation (`/api/generate-reply`) |
| `LLM_MAX_TOKENS` | both apps | Reply length cap (default `80` — short spoken turns) |
| `ELEVENLABS_API_KEY` | voice-only, abstract | ElevenLabs TTS |
| `ELEVENLABS_VOICE_ID` | voice-only, abstract | Voice to synthesize with |
| `AZURE_SPEECH_KEY` | abstract | Azure Speech TTS |
| `AZURE_SPEECH_REGION` | abstract | e.g. `eastasia` |
| `AZURE_SPEECH_VOICE` | abstract | e.g. `en-US-JennyNeural` |
| `IFLYTEK_APP_ID` / `IFLYTEK_API_KEY` / `IFLYTEK_API_SECRET` | both apps (optional) | iFlytek STT/TTS, better for Mandarin |
| `MODE_VOICE_ONLY_URL` | landing | Link target for the Voice Only card |
| `MODE_ABSTRACT_URL` | landing | Link target for the Abstract card |
| `MODE_CARTOONISH_URL` | landing | Link target for the Cartoonish card |
| `MODE_HUMAN_REALISTIC_URL` | landing | Link target for the Human-Realistic card |
| `PORT` | landing | Launcher port (default `5001`) |

Copy the relevant `.env.example` and fill it in. `.env` / `.env.local` are
git-ignored — do not commit real keys.

---

## Provider proxy routes

Both apps expose the same route surface, so providers can be swapped per
deployment without touching UI code:

| Route | Method | Description |
|---|---|---|
| `/api/health` | GET | Reports which providers are configured and reachable |
| `/api/generate-reply` | POST | Prompt → short spoken reply |
| `/api/elevenlabs-tts` | POST | Text → `audio/mpeg` via ElevenLabs |
| `/api/azure-tts` | POST | Text → audio via Azure Speech |
| `/api/iflytek-stt` | POST | Audio → transcript via iFlytek |
| `/api/iflytek-tts` | POST | Text → audio via iFlytek |

---

## Repository layout

```
.
├── landing/                    Flask launcher
│   ├── app.py                  routes + mode URL table
│   ├── templates/index.html    mode picker UI
│   └── static/                 launcher CSS/JS/assets
├── apps/
│   ├── voice-only/             Next.js app — minimal voice mode
│   │   ├── app/api/            provider proxy routes
│   │   ├── components/         VoiceInterface, visualisation
│   │   ├── lib/                STT/TTS/LLM clients
│   │   └── scripts/whisper-stt local Whisper service
│   └── abstract/               Next.js app — visual mode (adds azure-tts)
└── docs/
    ├── SYSTEM_DOCUMENTATION.md      design concept, user flow, components, algorithms
    └── MODES_AND_ARCHITECTURE.md    per-mode architecture, comms flow, deployment
```

---

## Tech stack

Next.js 14 · React 18 · TypeScript · TailwindCSS · three.js / React Three Fiber /
drei / postprocessing · Flask · FastAPI + openai-whisper (optional local STT)

---

## Security notes

- Provider keys are read from server-side environment variables only.
- This repository ships **no** credentials. `.env`, `.env.local`, `.env.*.local`
  and the local venvs/build outputs are git-ignored.
- If you deploy the launcher publicly, restrict outbound access from your
  Next.js apps — the TTS/STT routes are open proxies by default and should sit
  behind your own auth layer.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
