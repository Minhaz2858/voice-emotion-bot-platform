import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

function getEnv(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

export async function POST(req: NextRequest) {
  try {
    const { text, voiceName, outputFormat } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "text" in request body' }), { status: 400 });
    }

    // Primary and secondary Azure Speech credentials
    const primary = {
      region: getEnv('AZURE_SPEECH_REGION', 'eastasia').trim(),
      key: getEnv('AZURE_SPEECH_KEY').trim(),
    };
    const secondary = {
      region: getEnv('AZURE_SPEECH_REGION_SECONDARY', 'southeastasia').trim(),
      key: getEnv('AZURE_SPEECH_KEY_SECONDARY', '').trim(),
    };

    async function tryIssueToken(region: string, key: string) {
      if (!region || !key) return { ok: false, msg: 'Missing region or key' };
      const tokenRes = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': '0',
        },
      });
      const msg = await tokenRes.text();
      return { ok: tokenRes.ok, msg, region, key };
    }

    // Try primary, then secondary if needed
    let tokenResult = await tryIssueToken(primary.region, primary.key);
    if (!tokenResult.ok && secondary.key) {
      tokenResult = await tryIssueToken(secondary.region, secondary.key);
    }
    if (!tokenResult.ok) {
      return new Response(JSON.stringify({ error: `Failed to issue token: ${tokenResult.msg}` }), { status: 401 });
    }
    const accessToken = tokenResult.msg;
    const region = tokenResult.region;

    const voice = typeof voiceName === 'string' && voiceName.length > 0 ? voiceName : 'en-US-JennyNeural';
    const format = typeof outputFormat === 'string' && outputFormat.length > 0 ? outputFormat : 'audio-24khz-48kbitrate-mono-mp3';

    const ssml = `<?xml version="1.0" encoding="UTF-8"?>\n<speak version="1.0" xml:lang="en-US">\n  <voice name="${voice}">${escapeXml(text)}</voice>\n</speak>`;

    const ttsRes = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': format,
        'User-Agent': 'voice-bot',
      },
      body: ssml,
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return new Response(JSON.stringify({ error: `Azure TTS error: ${ttsRes.status} ${errText}` }), { status: ttsRes.status });
    }

    const audio = await ttsRes.arrayBuffer();
    return new Response(Buffer.from(audio), {
      status: 200,
      headers: {
        'Content-Type': inferContentType(format),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function inferContentType(fmt: string): string {
  // Map a few common formats to content-type
  if (fmt.includes('mp3')) return 'audio/mpeg';
  if (fmt.includes('ogg')) return 'audio/ogg';
  if (fmt.includes('webm')) return 'audio/webm';
  if (fmt.includes('pcm')) return 'audio/wav';
  return 'application/octet-stream';
}
