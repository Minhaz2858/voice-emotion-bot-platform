'use client';

import { useRef, useState } from 'react';
import { WebSpeechSTTClient } from '@/lib/web-speech-stt';
import { generateReply } from '@/lib/text-generation';

/**
 * ElevenLabs Text-to-Speech (TTS) client (browser-side)
 * Calls our Next.js route to synthesize and plays audio.
 */

interface ElevenLabsTTSOptions {
  apiPath?: string; // override route path
}

class ElevenLabsTTSClient {
  private readonly apiPath: string;
  private audioContext: AudioContext | null = null;

  constructor(options: ElevenLabsTTSOptions = {}) {
    this.apiPath = options.apiPath || '/api/elevenlabs-tts';
  }

  async synthesizeAndPlay(text: string): Promise<void> {
    try {
      console.log('ElevenLabs: Synthesizing text via API:', text);

      const res = await fetch(this.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`ElevenLabs TTS route error: ${res.status}`, err);
        throw new Error(`ElevenLabs TTS error: ${res.status}`);
      }

      const audioBuffer = await res.arrayBuffer();
      console.log('ElevenLabs: Audio received from API, playing...');
      await this.playAudio(audioBuffer);
    } catch (error) {
      console.error('ElevenLabs synthesis failed:', error);
      throw error;
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('Audio context resumed');
    }

    try {
      const decoded = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = decoded;

      const gainNode = this.audioContext.createGain();
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      console.log('ElevenLabs: Starting audio playback, duration:', decoded.duration.toFixed(2), 'sec');

      source.start(0);

      await new Promise<void>((resolve) => {
        source.onended = () => {
          console.log('ElevenLabs: Playback complete');
          resolve();
        };
      });
    } catch (error) {
      console.error('ElevenLabs audio playback failed:', error);
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

export { ElevenLabsTTSClient };


export default function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [placeholder, setPlaceholder] = useState('Ask anything');
  const [loading, setLoading] = useState(false);
  const clientRef = useRef<WebSpeechSTTClient | null>(null);
  const ttsClientRef = useRef<ElevenLabsTTSClient | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultTimeRef = useRef<number>(0);

  // Start/stop listening for voice
  const handleVoiceClick = async () => {
    // If listening, stop listening
    if (isListening) {
      clientRef.current?.disconnect();
      setIsListening(false);
      setPlaceholder('Ask anything');
      return;
    }
    // If speaking, stop speaking
    if (isSpeaking) {
      if (ttsClientRef.current) {
        ttsClientRef.current.close();
      }
      setIsSpeaking(false);
      setPlaceholder('Ask anything');
      return;
    }
    setIsListening(true);
    setPlaceholder('Listening...');
    finalTranscriptRef.current = '';
    lastResultTimeRef.current = Date.now();
    
    clientRef.current = new WebSpeechSTTClient({
      onTranscript: async (text, isFinal) => {
        lastResultTimeRef.current = Date.now();
        
        if (isFinal) {
          finalTranscriptRef.current = text;
          console.log('Final result received:', text);
        }
        
        // Clear previous timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Wait 2 seconds of silence (no new speech detected) before processing
        silenceTimeoutRef.current = setTimeout(async () => {
          const finalText = finalTranscriptRef.current.trim();
          
          // Only process if we have text and no new results in the past 2 seconds
          if (!finalText) {
            console.log('No text detected, continuing to listen');
            return;
          }
          
          const timeSinceLastResult = Date.now() - lastResultTimeRef.current;
          if (timeSinceLastResult < 2000) {
            console.log('Still receiving results, waiting longer');
            return;
          }
          
          console.log('Silence detected, processing:', finalText);
          
          // Stop listening
          setIsListening(false);
          setPlaceholder('Thinking...');
          clientRef.current?.disconnect();
          
          // Generate reply
          setLoading(true);
          const reply = await generateReply({ prompt: finalText });
          setLoading(false);
          
          // Speak reply
          setPlaceholder('Speaking...');
          ttsClientRef.current = new ElevenLabsTTSClient();
          setIsSpeaking(true);
          
          try {
            await ttsClientRef.current.synthesizeAndPlay(reply);
          } catch (error) {
            console.error('TTS failed:', error);
          }
          
          setIsSpeaking(false);
          setPlaceholder('Ask anything');
        }, 2000); // 2 second silence timeout
      },
      onError: () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        setPlaceholder('Ask anything');
      },
      onClose: () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        setPlaceholder('Ask anything');
      },
      language: 'en-US',
    });
    clientRef.current.connect();
  };

  // Minimal UI bar
  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-3xl px-4">
        <div className="flex items-center bg-white rounded-full shadow-xl px-6 py-3" style={{ minHeight: 64 }}>
          <span className="text-2xl text-neutral-400 mr-4">+</span>
          <input
            className="flex-1 bg-transparent outline-none text-lg text-neutral-800 placeholder-neutral-400"
            type="text"
            value={''}
            placeholder={placeholder}
            readOnly
            style={{ minWidth: 0 }}
          />
          <button
            className="ml-4 text-neutral-400 hover:text-neutral-700 focus:outline-none"
            aria-label="Start voice input"
            onClick={handleVoiceClick}
            disabled={loading}
          >
            {/* Mic icon */}
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" d="M12 17a4 4 0 0 0 4-4V7a4 4 0 1 0-8 0v6a4 4 0 0 0 4 4Zm6-4v1a6 6 0 0 1-12 0v-1m6 6v2m-4 0h8"/>
            </svg>
          </button>
          <button
            className={`ml-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow ${
              (isListening || isSpeaking) ? 'ring-2 ring-cyber-blue' : ''
            }`}
            aria-label="Start voice input"
            onClick={handleVoiceClick}
            disabled={loading}
          >
            {/* Voice waveform icon */}
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              className={
                (isListening || isSpeaking)
                  ? 'text-cyber-blue'
                  : 'text-neutral-900'
              }
            >
              <path stroke="currentColor" strokeWidth="2" d="M4 12v2m4-6v10m4-14v18m4-14v10m4-6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
