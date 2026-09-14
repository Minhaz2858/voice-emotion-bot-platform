import { NextRequest, NextResponse } from 'next/server';
import { iflytekSTT } from '../../../lib/iflytek-stt';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio');
  if (!audio) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
  }
  try {
    const transcript = await iflytekSTT(audio);
    return NextResponse.json({ transcript });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'STT failed' }, { status: 500 });
  }
}
