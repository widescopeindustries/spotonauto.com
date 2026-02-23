import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are SpotOn Guide — a friendly AI assistant for SpotOnAuto.com, an AI-powered vehicle repair platform.

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

When someone expresses clear upgrade intent, include at end of your message (NOT visible to user):
[UPGRADE_INTENT: reason="pdf|unlimited-diagnostics|garage"]`;

export async function POST(req: NextRequest) {
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

    const chat = genAI.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 200,
        temperature: 0.7,
      },
      history,
    });

    const result = await chat.sendMessage({ message: lastMessage.content });
    const reply = result.text || "";

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
