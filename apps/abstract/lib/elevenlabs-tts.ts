/**
 * ElevenLabs Text-to-Speech (TTS) client
 * Calls our Next.js API route and plays synthesized audio
 */

interface ElevenLabsTTSOptions {
  apiPath?: string;
}

export class ElevenLabsTTSClient {
  private readonly apiPath: string;
  private audioContext: AudioContext | null = null;

  constructor(options: ElevenLabsTTSOptions = {}) {
    this.apiPath = options.apiPath || "/api/elevenlabs-tts";
  }

  async synthesizeAndPlay(text: string): Promise<void> {
    try {
      console.log("ElevenLabs: Synthesizing text via API route:", text);

      const response = await fetch(this.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `ElevenLabs route error: ${response.status} ${errorData}`,
        );
      }

      const audioBuffer = await response.arrayBuffer();
      console.log("ElevenLabs: Audio received, playing...");

      // Play the audio
      await this.playAudio(audioBuffer);
    } catch (error) {
      console.error("ElevenLabs synthesis failed:", error);
      throw error;
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }

    // Resume audio context if suspended (common in browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
      console.log("Audio context resumed");
    }

    try {
      const audioBuffer_ = await this.audioContext.decodeAudioData(
        audioBuffer.slice(0), // Copy buffer
      );

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer_;

      const gainNode = this.audioContext.createGain();
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      console.log(
        "ElevenLabs: Starting audio playback, duration:",
        audioBuffer_.duration.toFixed(2),
        "sec",
      );

      source.start(0);

      // Wait for playback to finish
      await new Promise<void>((resolve) => {
        source.onended = () => {
          console.log("ElevenLabs: Playback complete");
          resolve();
        };
      });
    } catch (error) {
      console.error("ElevenLabs audio playback failed:", error);
      throw error;
    }
  }

  close() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
