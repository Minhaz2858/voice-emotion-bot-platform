
const APP_ID = process.env.IFLYTEK_APP_ID;
const API_KEY = process.env.IFLYTEK_API_KEY;
const API_SECRET = process.env.IFLYTEK_API_SECRET;


// Server-side function (already stubbed above)

// Browser-side TTS client for iFLYTEK
interface IflytekTTSOptions {
  apiPath?: string;
}

export class IflytekTTSClient {
  private readonly apiPath: string;
  private audioContext: AudioContext | null = null;

  constructor(options: IflytekTTSOptions = {}) {
    this.apiPath = options.apiPath || '/api/iflytek-tts';
  }

  async synthesizeAndPlay(text: string): Promise<void> {
    try {
      const res = await fetch(this.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn(`iFLYTEK TTS route error: ${res.status} ${err}.`);
        return;
      }
      const audioBuffer = await res.arrayBuffer();
      await this.playAudio(audioBuffer);
    } catch (e) {
      console.error('iFLYTEK TTS failed:', e);
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = this.audioContext;
    const decoded = await ctx.decodeAudioData(audioBuffer.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    source.connect(ctx.destination);
    source.start();
    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  }

  close() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
