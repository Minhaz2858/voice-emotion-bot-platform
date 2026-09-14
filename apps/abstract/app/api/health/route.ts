import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ServiceStatus = {
  ok: boolean;
  status?: number;
  error?: string;
};

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  async function checkOpenAI(): Promise<ServiceStatus> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: "Missing OPENAI_API_KEY" };
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });
      return {
        ok: res.ok,
        status: res.status,
        error: res.ok ? undefined : await safeText(res),
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "OpenAI check failed" };
    }
  }

  async function checkElevenLabs(): Promise<ServiceStatus> {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return { ok: false, error: "Missing ELEVENLABS_API_KEY" };
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/models", {
        method: "GET",
        headers: { "xi-api-key": key },
        signal: controller.signal,
      });
      return {
        ok: res.ok,
        status: res.status,
        error: res.ok ? undefined : await safeText(res),
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "ElevenLabs check failed" };
    }
  }

  try {
    const [openai, elevenLabs] = await Promise.all([
      checkOpenAI(),
      checkElevenLabs(),
    ]);

    const services: Record<string, ServiceStatus> = {
      openai,
      elevenLabs,
    };

    return NextResponse.json({ services, timestamp: new Date().toISOString() });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
