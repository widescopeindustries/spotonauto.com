import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

const SYSTEM_PROMPT = `You are a friendly auto repair guide for SpotOnAuto.com — a site that gives people free DIY repair guides for their specific car.

Your ONLY job is a 2-step conversation:

STEP 1: If you don't know the year, make, and model yet — ask for it. Keep it warm and brief.

STEP 2: Once you have year/make/model — ask what's going on with the car. One question, keep it simple.

STEP 3: Once you have the vehicle AND the problem, respond with:
- A short friendly message (1-2 sentences max, no fluff)
- Then on its own line: [ROUTE: year=YEAR make=MAKE model=MODEL]

Rules:
- MAKE and MODEL should be lowercase, single words or hyphenated (e.g. honda, civic, f-150, rav4)
- YEAR is 4 digits
- Never include the [ROUTE] tag until you have both the vehicle AND what's wrong
- Keep every response under 3 sentences
- Don't mention pricing, Pro tier, or subscriptions unprompted
- Be warm and direct — like a knowledgeable friend, not a manual

Examples:
User: "2018 Honda Civic"
You: "Nice choice! What's going on with it?"

User: "the brakes are squeaking"
You: "Got it — that's usually worn brake pads. I'll pull up your exact guide right now!
[ROUTE: year=2018 make=honda model=civic]"`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length > 16) {
      return NextResponse.json({
        reply: "Head to the search bar at the top — just type your car and we'll find it!",
      });
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 160,
      temperature: 0.6,
    });

    const raw = completion.choices[0]?.message?.content || "";

    // Parse route tag
    const routeMatch = raw.match(/\[ROUTE:\s*year=(\d{4})\s+make=([a-z0-9-]+)\s+model=([a-z0-9-]+)\]/i);

    let link: { href: string; label: string } | undefined;
    if (routeMatch) {
      const [, year, make, model] = routeMatch;
      const href = `/repair/${year}/${make}/${model}`;
      link = {
        href,
        label: `View ${year} ${make.charAt(0).toUpperCase() + make.slice(1)} ${model.charAt(0).toUpperCase() + model.slice(1)} Guides`,
      };
    }

    const cleanReply = raw.replace(/\[ROUTE:[^\]]+\]/g, "").trim();

    return NextResponse.json({ reply: cleanReply, link });
  } catch (err) {
    console.error("Greeter API error:", err);
    return NextResponse.json({
      reply: "Having a quick hiccup — try searching at the top of the page!",
    });
  }
}
