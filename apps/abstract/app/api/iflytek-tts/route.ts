import { NextRequest, NextResponse } from 'next/server';

// iFLYTEK TTS is not enabled in this deployment. The iFlytek client lives in
// lib/iflytek-tts.ts (IflytekTTSClient) if you want to wire it up; the active
// TTS path for this mode is /api/azure-tts.
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'iFLYTEK TTS is disabled. Use Azure Speech or ElevenLabs TTS instead.' },
    { status: 503 }
  );
}
