import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { checkRateLimit } from "@/lib/rateLimit";
import { getDTCGraphData } from "@/lib/graphQueries";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAI = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

const kimiApiKey = process.env.KIMI_API_KEY;
const kimi = kimiApiKey
  ? new OpenAI({ apiKey: kimiApiKey, baseURL: "https://api.moonshot.cn/v1" })
  : null;

const preferKimi = (() => {
  const raw = (process.env.KIMI_PRIMARY || "").trim().toLowerCase();
  if (!raw) return Boolean(kimiApiKey); // Default to Kimi when key is present
  return raw === "1" || raw === "true" || raw === "yes";
})();
const preferGemini = (() => {
  const raw = (process.env.GEMINI_PRIMARY || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
})();

function buildSystemPrompt(graphContext?: string): string {
  return `You are SpotOn Guide — a friendly AI assistant for SpotOnAuto.com, an AI-powered vehicle repair platform.

Your job is to help users find the right tool for their situation and naturally guide free users to upgrade to Pro when relevant.

FEATURES:
- AI Diagnostics (/diagnose): User describes a symptom, AI identifies causes and repair steps. Free users get 1 session. Pro = unlimited.
- Repair Guides (/guides): 57 pre-built guides for popular repairs (brakes, oil change, tire rotation, etc). Free: unlimited browsing.
- PDF Export: Export any repair guide as a formatted PDF. PRO ONLY.
- My Garage (/my-garage): Save vehicles and track repairs. Free: 1 vehicle. Pro: unlimited.

PRICING: Pro = $9.99/month. Cancel anytime.

ROUTING:
- Car problem / symptom / warning light / noise → route to /diagnose (ask for year/make/model if not given)
- How-to / repair guide / instructions → route to /guides
- PDF / printable / take to mechanic → mention Pro feature, offer upgrade
- Garage / save car / track repairs → route to /my-garage

STYLE:
- Keep responses to 2-3 sentences MAX
- Be helpful and direct, not salesy
- Only mention Pro when it's directly relevant to what they asked
- When routing somewhere, tell them where you're sending them ("Head to /diagnose and describe your symptom...")
- If someone describes a car problem, show genuine interest before routing
${graphContext ? '\nGROUNDING DATA (use this to answer accurately):\n' + graphContext : ''}

When someone expresses clear upgrade intent, include at end of your message (NOT visible to user):
[UPGRADE_INTENT: reason="pdf|unlimited-diagnostics|garage"]`;
}

async function extractGraphContext(message: string): Promise<string | undefined> {
  // Extract DTC codes like P0420, B1234, etc.
  const dtcMatch = message.match(/\b([A-Z]\d{4})\b/i);
  if (!dtcMatch) return undefined;

  const code = dtcMatch[1].toUpperCase();
  const data = await getDTCGraphData(code, 5);
  if (!data || !data.component) return undefined;

  const procedures = data.componentProcedures
    .slice(0, 3)
    .map((p) => `- ${p.title}${p.vehicleName ? ` (${p.vehicleName})` : ''}`)
    .join('\n');

  return `The user mentioned DTC ${code}: ${data.description || ''}.\n` +
    `Affected component: ${data.component}.\n` +
    `Related OEM procedures in our database (${data.totalProcedures} total):\n${procedures}`;
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 20, 60_000); // 20 chat msgs/min per IP
  if (limited) return limited;

  try {
    const { messages, sessionId, sourcePage } = await req.json();

    if (!messages || messages.length > 20) {
      return NextResponse.json({
        reply: "Head to SpotOnAuto.com to get started — try the AI Diagnostics for your vehicle!",
      });
    }

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    // Ground the AI in graph data if user mentions a DTC
    const graphContext = await extractGraphContext(lastMessage.content);
    const systemPrompt = buildSystemPrompt(graphContext);

    let reply = "";

    // Build OpenAI-compatible message list once (used by Kimi + OpenAI fallbacks)
    const buildOaiMessages = (): ChatCompletionMessageParam[] => [
      { role: "system", content: systemPrompt },
      ...history.map((item: { role: string; parts: { text: string }[] }): ChatCompletionMessageParam => ({
        role: item.role === "model" ? "assistant" : "user",
        content: item.parts.map((part: { text: string }) => part.text).join("\n"),
      })),
      { role: "user", content: lastMessage.content },
    ];

    try {
      // ─── Primary: Kimi (you) ────────────────────────────────────────────────
      if (preferKimi && kimi) {
        const completion = await kimi.chat.completions.create({
          model: process.env.KIMI_MODEL || "kimi-latest",
          messages: buildOaiMessages(),
          temperature: 0.7,
          max_tokens: 200,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
      // ─── Primary: Gemini (only if explicitly set) ───────────────────────────
      else if (preferGemini && geminiApiKey) {
        const chat = genAI.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 200,
            temperature: 0.7,
          },
          history,
        });
        const result = await chat.sendMessage({ message: lastMessage.content });
        reply = result.text || "";
      }
      // ─── No primary available ───────────────────────────────────────────────
      else {
        throw new Error("No AI provider configured.");
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isQuotaError =
        errMsg.includes("resource_exhausted") ||
        errMsg.includes("quota") ||
        errMsg.includes("rate limit") ||
        errMsg.includes("429") ||
        errMsg.includes("insufficient_quota");

      // ─── Fallback 1: Gemini (if Kimi failed) ────────────────────────────────
      if (geminiApiKey && !preferGemini && isQuotaError) {
        console.warn("[SpotOn Guide] Falling back to Gemini:", error);
        const chat = genAI.chats.create({
          model: "gemini-2.0-flash",
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 200,
            temperature: 0.7,
          },
          history,
        });
        const result = await chat.sendMessage({ message: lastMessage.content });
        reply = result.text || "";
      }
      // ─── Fallback 2: OpenAI ─────────────────────────────────────────────────
      else if (openAI && isQuotaError) {
        console.warn("[SpotOn Guide] Falling back to OpenAI:", error);
        const completion = await openAI.chat.completions.create({
          model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
          messages: buildOaiMessages(),
          temperature: 0.7,
        });
        reply = completion.choices[0]?.message?.content?.trim() || "";
      }
      // ─── No fallback available ──────────────────────────────────────────────
      else {
        throw error;
      }
    }

    // Check for upgrade intent
    const upgradeMatch = reply.match(/\[UPGRADE_INTENT:\s*reason="([^"]+)"\]/);

    // Determine if we should suggest a redirect
    let redirect: string | null = null;
    const lowerReply = reply.toLowerCase();
    const lowerMsg = lastMessage.content.toLowerCase();

    if (
      (lowerMsg.includes("diagnose") || lowerMsg.includes("symptom") || lowerMsg.includes("problem") ||
       lowerMsg.includes("noise") || lowerMsg.includes("light") || lowerMsg.includes("check engine")) &&
      !lowerMsg.includes("guide") && !lowerMsg.includes("pdf")
    ) {
      redirect = "/diagnose";
    } else if (
      (lowerMsg.includes("guide") || lowerMsg.includes("how to") || lowerMsg.includes("repair") ||
       lowerMsg.includes("change") || lowerMsg.includes("replace")) &&
      !lowerMsg.includes("pdf")
    ) {
      redirect = "/guides";
    }

    // Log session for analytics (fire and forget)
    if (upgradeMatch || messages.length === 2) {
      console.log(`[SpotOn Guide] session=${sessionId} page=${sourcePage} upgrade=${upgradeMatch?.[1] || "none"} msgs=${messages.length}`);
    }

    // Strip the tag from visible reply
    const cleanReply = reply.replace(/\[UPGRADE_INTENT:[^\]]+\]/, "").trim();

    return NextResponse.json({ reply: cleanReply, redirect });
  } catch (err) {
    console.error("SpotOn Guide API error:", err);
    return NextResponse.json(
      {
        reply: "Having a hiccup — try the Diagnose button in the nav or browse our Repair Guides!",
      },
      { status: 500 }
    );
  }
}
