import { NextRequest, NextResponse } from 'next/server';
import { iflytekTTS } from '../../../lib/iflytek-tts';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }
  try {
    const audioBuffer = await iflytekTTS(text);
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
}
