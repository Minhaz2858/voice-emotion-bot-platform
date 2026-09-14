import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt } = await request.json();

    const openaiKey = process.env.OPENAI_API_KEY;
    const maxTokens = Number(process.env.LLM_MAX_TOKENS || 80);

    const system =
      systemPrompt ||
      `You are AuraVoice AI, a warm, empathetic voice assistant. Your role is to:
- Listen carefully and show genuine understanding
- Validate the user's feelings and concerns
- Respond with warmth, compassion, and authenticity
- Offer thoughtful, supportive feedback
- Keep responses brief (under 30 seconds of speech) but meaningful
- Use a conversational, human tone—no robotic phrasing
Always respond as if you truly care about what the user just shared.`;

    const tryOpenAI = async (): Promise<string | null> => {
      if (!openaiKey) return null;
      // Primary attempt: Chat Completions
      const chatRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
          }),
        },
      );

      if (chatRes.ok) {
        const json = await chatRes.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        // If chat fails, capture details and try Responses API as fallback
        const errText = await chatRes.text();
        console.warn("OpenAI Chat API error:", chatRes.status, errText);
      }

      // Fallback: Responses API
      const respRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          max_output_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (respRes.ok) {
        const respJson = await respRes.json();
        const text =
          respJson.output_text || respJson.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        const errText = await respRes.text();
        console.warn("OpenAI Responses API error:", respRes.status, errText);
      }
      return null;
    };

    const outputText = await tryOpenAI();

    if (outputText) {
      return NextResponse.json({ text: outputText });
    }

    return NextResponse.json(
      {
        error: "OpenAI request failed",
        details: "Check OPENAI_API_KEY, quota, or try again later.",
      },
      { status: 429 },
    );
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
