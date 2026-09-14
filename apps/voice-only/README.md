# Voice Only mode

The minimal voice conversation interface: no chart chrome, no 3D scene — mic in,
spoken reply out.

**Pipeline:** browser Web Speech STT → server-side LLM reply (`/api/generate-reply`)
→ server-side ElevenLabs TTS (`/api/elevenlabs-tts`) → playback.

## Run

```bash
cp .env.example .env.local     # add your keys
npm install
npm run dev                    # http://localhost:3000
```

## What lives here

| Path | Purpose |
|---|---|
| `components/VoiceInterface.tsx` | Recording/playback state machine and UI |
| `app/api/generate-reply` | Prompt → short spoken reply (LLM, server-side) |
| `app/api/elevenlabs-tts` | Text → `audio/mpeg` (ElevenLabs, server-side) |
| `app/api/azure-tts`, `app/api/iflytek-*` | Optional alternative providers |
| `app/api/health` | Reports which providers are configured/reachable |
| `lib/` | STT/TTS/LLM clients (Web Speech, ElevenLabs, Whisper, iFlytek, Deepgram) |
| `scripts/whisper-stt/` | Optional local Whisper transcription service |

Provider keys are read server-side only — see the root [README](../README.md) for
the full environment-variable table.
