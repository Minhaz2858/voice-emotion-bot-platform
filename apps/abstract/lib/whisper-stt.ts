
import axios from 'axios';

const WHISPER_STT_URL =
  process.env.WHISPER_STT_URL || 'http://localhost:8001/transcribe';
import { Blob } from 'buffer';

export async function whisperSTT(audio: any): Promise<string> {
  // Convert audio to Buffer if needed
  let audioBuffer: Buffer;
  if (audio instanceof Buffer) {
    audioBuffer = audio;
  } else if (audio.arrayBuffer) {
    audioBuffer = Buffer.from(await audio.arrayBuffer());
  } else {
    throw new Error('Unsupported audio format');
  }
  const formData = new FormData();
  formData.append('file', audioBuffer, 'audio.wav');
  const response = await axios.post(WHISPER_STT_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data.text;
}

export async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  const response = await axios.post(WHISPER_STT_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data.text;
}
