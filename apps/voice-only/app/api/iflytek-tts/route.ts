import { NextRequest, NextResponse } from 'next/server';

// iFLYTEK TTS is disabled. Use ElevenLabs TTS instead.
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'iFLYTEK TTS is disabled. Please use ElevenLabs TTS instead.' },
    { status: 503 }
  );
}
