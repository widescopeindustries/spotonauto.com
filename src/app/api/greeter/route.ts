import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

const SYSTEM_PROMPT = `You are a friendly auto repair guide for SpotOnAuto.com — a site with free DIY repair guides AND an AI diagnosis tool for any car problem.

Your job is a fast 3-step conversation:

STEP 1: If you don't know the year, make, and model — ask. Warm and brief.

STEP 2: Once you have year/make/model — ask what's going on with the car. One question.

STEP 3: Once you have vehicle AND problem, respond with:
- A short friendly message (1-2 sentences, no fluff) acknowledging the issue
- Then on its own line: [ROUTE: year=YEAR make=MAKE model=MODEL]

Rules:
- MAKE and MODEL: lowercase, single words or hyphenated (honda, civic, f-150, rav4)
- YEAR: 4 digits
- Never include [ROUTE] until you have both vehicle AND problem
- Keep every response under 3 sentences
- Be warm and direct — knowledgeable friend, not a manual

Examples:
User: "2018 Honda Civic"
You: "Nice! What's going on with it?"

User: "brakes are squeaking"
You: "Got it — sounds like worn brake pads. Pulling up your exact guide now!
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
    let followUp: { content: string; link: { href: string; label: string } } | undefined;

    if (routeMatch) {
      const [, year, make, model] = routeMatch;
      const makeName = make.charAt(0).toUpperCase() + make.slice(1);
      const modelName = model.charAt(0).toUpperCase() + model.slice(1);
      const href = `/repair/${year}/${make}/${model}`;
      link = {
        href,
        label: `View ${year} ${makeName} ${modelName} Guides`,
      };
      followUp = {
        content: `Also — Pro members get the AI diagnosis tool for any problem on their ${makeName} + printable repair manuals. Want to try it free for 7 days?`,
        link: { href: "/diagnose", label: "Try Pro Free ⚡" },
      };
    }

    const cleanReply = raw.replace(/\[ROUTE:[^\]]+\]/g, "").trim();

    return NextResponse.json({ reply: cleanReply, link, followUp });
  } catch (err) {
    console.error("Greeter API error:", err);
    return NextResponse.json({
      reply: "Having a quick hiccup — try searching at the top of the page!",
    });
  }
}
