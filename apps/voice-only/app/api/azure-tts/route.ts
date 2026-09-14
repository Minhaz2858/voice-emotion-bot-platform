import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Azure TTS is disabled. Use ElevenLabs TTS instead.
export async function POST(req: NextRequest) {
  return new Response(JSON.stringify({ 
    error: 'Azure TTS is disabled. Please use ElevenLabs TTS instead.' 
  }), { 
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}
