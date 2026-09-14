# Abstract mode

Same voice pipeline as Voice Only, plus a reactive 3D "glow sphere" that responds
to microphone and playback intensity, and Azure Speech as the primary TTS path
(iFlytek and Whisper are available as alternates).

**Pipeline:** browser STT (Web Speech, or recorded audio → local Whisper) →
server-side LLM reply (`/api/generate-reply`) → server-side Azure Speech TTS
(`/api/azure-tts`) → playback, with the visual scene driven by an `AudioProcessor`
(frequency-analysis) loop.

## Run

```bash
cp .env.example .env.local     # add your keys
npm install
npm run dev -- --port 3002     # http://localhost:3002
```

## What lives here

| Path | Purpose |
|---|---|
| `components/VoiceInterface.tsx` | Phase machine (`idle`/`listening`/`processing`/`speaking`) + UI |
| `components/GlowSphere.tsx`, `components/shaders.ts` | three.js/React Three Fiber visualisation |
| `lib/audio-processor.ts` | Mic capture, silence detection, intensity analysis |
| `app/api/azure-tts` | Text → audio (Azure Speech, server-side) |
| `app/api/generate-reply` | Prompt → short spoken reply (LLM, server-side) |
| `lib/azure-tts.ts` | Azure Speech client used by the visual mode |
| `scripts/whisper-stt/` | Optional local Whisper transcription service |

Provider keys are read server-side only — see the root [README](../README.md) for
the full environment-variable table.
