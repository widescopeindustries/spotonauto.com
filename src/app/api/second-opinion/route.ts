
export const maxDuration = 45;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rateLimit';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey || '' });
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAI = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;
const TEXT_MODEL = 'gemini-2.0-flash';
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';
const preferOpenAI = (() => {
  const raw = (process.env.OPENAI_PRIMARY || '').trim().toLowerCase();
  if (!raw) return Boolean(openAiApiKey);
  return raw === '1' || raw === 'true' || raw === 'yes';
})();

const secondOpinionSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      description: 'One of: "Fair Price", "Seems High", "Red Flag", "Seems Low"',
    },
    confidence: {
      type: Type.STRING,
      description: 'Confidence level: "High", "Medium", or "Low"',
    },
    avgPrice: {
      type: Type.NUMBER,
      description: 'Average cost in dollars for this repair on this vehicle',
    },
    priceRange: {
      type: Type.OBJECT,
      properties: {
        low: { type: Type.NUMBER, description: 'Low end of typical price range' },
        high: { type: Type.NUMBER, description: 'High end of typical price range' },
      },
      required: ['low', 'high'],
    },
    summary: {
      type: Type.STRING,
      description: 'A 1-2 sentence summary explaining the verdict',
    },
    flags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Warning flags or notable observations about the quote',
    },
    commonMisdiagnoses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Common misdiagnoses for this issue on this vehicle',
    },
    questionsToAsk: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Questions the owner should ask their mechanic',
    },
    alternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Alternative diagnoses or repairs to consider',
    },
    partsBreakdown: {
      type: Type.STRING,
      description: 'Brief breakdown of typical parts vs labor cost split',
    },
  },
  required: [
    'verdict',
    'confidence',
    'avgPrice',
    'priceRange',
    'summary',
    'flags',
    'commonMisdiagnoses',
    'questionsToAsk',
    'alternatives',
    'partsBreakdown',
  ],
};

const quoteExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    mechanicDiagnosis: {
      type: Type.STRING,
      description: 'Short summary of what the shop says needs to be repaired.',
    },
    quotedPrice: {
      type: Type.NUMBER,
      description: 'Total quoted customer price in USD as a number without symbols.',
    },
  },
  required: ['mechanicDiagnosis', 'quotedPrice'],
};

function sanitizePrice(value: unknown): number | null {
  if (typeof value === 'number') {
    if (Number.isFinite(value) && value > 0) return value;
    return null;
  }

  if (typeof value !== 'string') return null;
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = String(dataUrl || '').match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  return { mimeType: match[1].toLowerCase(), base64Data: match[2] };
}

function humanizeLabel(value: string): string {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSafeText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toSafeText(item))
      .filter(Boolean)
      .slice(0, 12);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const label = humanizeLabel(key);
        const entryText = toSafeText(entry);
        if (!entryText || entryText === 'true' || entryText === 'false') return label;
        return `${label}: ${entryText}`;
      })
      .filter(Boolean)
      .slice(0, 12);
  }

  const single = toSafeText(value);
  return single ? [single] : [];
}

async function extractQuoteFieldsWithGemini(input: {
  imageDataUrl: string;
  year: string;
  make: string;
  model: string;
}): Promise<{ mechanicDiagnosis: string; quotedPrice: number }> {
  if (!apiKey) throw new Error('Gemini API key unavailable for extraction');
  const parsed = parseDataUrl(input.imageDataUrl);
  if (!parsed) throw new Error('Invalid quote image format');

  const response = await genAI.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        text: `Read this mechanic estimate image for a ${input.year} ${input.make} ${input.model}.

Return JSON with:
- mechanicDiagnosis: concise plain-English repair summary
- quotedPrice: total quote amount in USD as a number

If multiple totals appear, use the final customer pay amount (out-the-door total).`,
      },
      {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.base64Data,
        },
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: quoteExtractionSchema,
    },
  });

  const text = (response.text || '').trim().replace(/^```json\s*|```$/g, '');
  const data = JSON.parse(text);
  const quotedPrice = sanitizePrice(data.quotedPrice);
  const mechanicDiagnosis = String(data.mechanicDiagnosis || '').trim();

  if (!mechanicDiagnosis || !quotedPrice) {
    throw new Error('Could not extract quote details from image');
  }

  return { mechanicDiagnosis, quotedPrice };
}

async function extractQuoteFieldsWithOpenAI(input: {
  imageDataUrl: string;
  year: string;
  make: string;
  model: string;
}): Promise<{ mechanicDiagnosis: string; quotedPrice: number }> {
  if (!openAI) throw new Error('OpenAI API key unavailable for extraction');

  const completion = await openAI.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Extract mechanic estimate details from images. Return valid JSON only.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Read this mechanic estimate image for a ${input.year} ${input.make} ${input.model}.
Return JSON with:
- mechanicDiagnosis: concise plain-English repair summary
- quotedPrice: total quote amount in USD as a number
Use the final customer-pay total if multiple prices appear.`,
          },
          {
            type: 'image_url',
            image_url: { url: input.imageDataUrl },
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  const text = completion.choices[0]?.message?.content?.trim() || '';
  const data = JSON.parse(text.replace(/^```json\s*|```$/g, ''));
  const quotedPrice = sanitizePrice(data.quotedPrice);
  const mechanicDiagnosis = String(data.mechanicDiagnosis || '').trim();

  if (!mechanicDiagnosis || !quotedPrice) {
    throw new Error('Could not extract quote details from image');
  }

  return { mechanicDiagnosis, quotedPrice };
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 5, 60_000); // 5 quotes/min per IP
  if (limited) return limited;

  if (!apiKey && !openAiApiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing AI API key' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { year, make, model, mechanicDiagnosis, quotedPrice, symptoms, quoteImageDataUrl } = body;

    if (!year || !make || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: year, make, model' },
        { status: 400 }
      );
    }

    const normalizedDiagnosis = String(mechanicDiagnosis || '').trim();
    const normalizedImage = String(quoteImageDataUrl || '').trim();
    const typedPrice = sanitizePrice(quotedPrice);
    const hadManualDetails = Boolean(normalizedDiagnosis && typedPrice);
    const hadImageUpload = Boolean(normalizedImage);
    const quoteInputMode = hadImageUpload
      ? (hadManualDetails ? 'manual_plus_image' : 'image_only')
      : 'manual_only';
    const imagePayload = normalizedImage ? parseDataUrl(normalizedImage) : null;
    if (normalizedImage && !imagePayload) {
      return NextResponse.json({ error: 'Invalid quote image format. Use JPG, PNG, or WEBP.' }, { status: 400 });
    }

    if (imagePayload) {
      // Approx binary bytes from base64 length
      const imageBytes = Math.floor((imagePayload.base64Data.length * 3) / 4);
      const maxBytes = 5 * 1024 * 1024;
      if (imageBytes > maxBytes) {
        return NextResponse.json({ error: 'Quote image must be 5MB or smaller.' }, { status: 400 });
      }
    }

    let resolvedDiagnosis = normalizedDiagnosis;
    let resolvedPrice = typedPrice;
    let extractedFromImage = false;

    if ((!resolvedDiagnosis || !resolvedPrice) && normalizedImage) {
      try {
        const extracted = preferOpenAI
          ? await extractQuoteFieldsWithOpenAI({ imageDataUrl: normalizedImage, year, make, model })
          : await extractQuoteFieldsWithGemini({ imageDataUrl: normalizedImage, year, make, model });

        if (!resolvedDiagnosis) resolvedDiagnosis = extracted.mechanicDiagnosis;
        if (!resolvedPrice) resolvedPrice = extracted.quotedPrice;
        extractedFromImage = true;
      } catch (primaryError) {
        const canFallback = preferOpenAI ? Boolean(apiKey) : Boolean(openAiApiKey);
        if (!canFallback) throw primaryError;

        const extracted = preferOpenAI
          ? await extractQuoteFieldsWithGemini({ imageDataUrl: normalizedImage, year, make, model })
          : await extractQuoteFieldsWithOpenAI({ imageDataUrl: normalizedImage, year, make, model });

        if (!resolvedDiagnosis) resolvedDiagnosis = extracted.mechanicDiagnosis;
        if (!resolvedPrice) resolvedPrice = extracted.quotedPrice;
        extractedFromImage = true;
      }
    }

    if (!resolvedDiagnosis || !resolvedPrice) {
      return NextResponse.json(
        { error: 'Enter diagnosis + quote price, or upload a clear quote image so we can extract them.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert automotive cost analyst and mechanic advisor. Your job is to evaluate mechanic repair quotes and help car owners determine if they are being charged fairly.

You have deep knowledge of:
- Average repair costs for all common vehicles (parts + labor)
- Regional labor rates ($80-$150/hr depending on area; national average ~$100-$120/hr)
- Common mechanic upsells and unnecessary add-ons
- Frequently misdiagnosed issues (e.g., P0420 is often an O2 sensor, not a full catalytic converter replacement)
- OEM vs aftermarket parts pricing differences
- Dealer vs independent shop pricing (dealers typically 20-40% more)
- Which repairs are genuinely complex vs simple

VERDICT GUIDELINES:
- "Fair Price": Quoted price is within the typical range for this repair on this vehicle
- "Seems High": Quoted price is 20%+ above the typical high-end range
- "Red Flag": Quoted price is 50%+ above typical, OR the diagnosis itself seems suspicious/unnecessary
- "Seems Low": Quoted price is significantly below typical cost — could mean corners cut, used parts, or incomplete repair

Always be honest and specific. Reference the actual vehicle when discussing pricing.
Provide actionable advice the owner can use when talking to their mechanic.`;

    const userPrompt = `Evaluate this mechanic quote:

Vehicle: ${year} ${make} ${model}
Mechanic's Diagnosis: ${resolvedDiagnosis}
Quoted Price: $${resolvedPrice.toFixed(2)}
${symptoms ? `Owner's Symptoms: ${symptoms}` : ''}

Provide your analysis as JSON with: verdict, confidence, avgPrice, priceRange (low/high), summary, flags, commonMisdiagnoses, questionsToAsk, alternatives, partsBreakdown.`;

    let data: any;

    try {
      if (preferOpenAI || !apiKey) {
        throw new Error('Gemini API key is unavailable.');
      }

      const response = await genAI.models.generateContent({
        model: TEXT_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: secondOpinionSchema,
        },
      });

      const text = (response.text || '').trim().replace(/^```json\s*|```$/g, '');
      data = JSON.parse(text);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const shouldFallback = openAI && (
        preferOpenAI ||
        !apiKey ||
        message.includes('resource_exhausted') ||
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('429')
      );

      if (!shouldFallback) {
        throw error;
      }

      console.warn('[Second Opinion] Falling back to OpenAI:', error);
      const completion = await openAI.chat.completions.create({
        model: OPENAI_TEXT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${systemPrompt}\nReturn valid JSON only.` },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      });

      const text = completion.choices[0]?.message?.content?.trim() || '';
      data = JSON.parse(text.replace(/^```json\s*|```$/g, ''));
    }

    // Validate the verdict value
    const validVerdicts = ['Fair Price', 'Seems High', 'Red Flag', 'Seems Low'];
    if (!validVerdicts.includes(data.verdict)) {
      data.verdict = 'Fair Price';
    }

    const normalizedResponse = {
      ...data,
      summary: toSafeText(data.summary) || 'Quote analyzed successfully.',
      confidence: toSafeText(data.confidence) || 'Medium',
      partsBreakdown: toSafeText(data.partsBreakdown) || 'Parts and labor mix varies by shop and region.',
      avgPrice: sanitizePrice(data.avgPrice) || resolvedPrice,
      priceRange: {
        low: sanitizePrice(data?.priceRange?.low) || Math.max(50, Math.round(resolvedPrice * 0.7)),
        high: sanitizePrice(data?.priceRange?.high) || Math.max(100, Math.round(resolvedPrice * 1.3)),
      },
      flags: coerceStringArray(data.flags),
      commonMisdiagnoses: coerceStringArray(data.commonMisdiagnoses),
      questionsToAsk: coerceStringArray(data.questionsToAsk),
      alternatives: coerceStringArray(data.alternatives),
    };

    if (normalizedResponse.priceRange.high < normalizedResponse.priceRange.low) {
      const low = normalizedResponse.priceRange.high;
      normalizedResponse.priceRange.high = normalizedResponse.priceRange.low;
      normalizedResponse.priceRange.low = low;
    }

    return NextResponse.json({
      ...normalizedResponse,
      vehicle: { year, make, model },
      quotedPrice: resolvedPrice,
      mechanicDiagnosis: resolvedDiagnosis,
      quoteInputMode,
      extractedFromImage,
    });
  } catch (error: any) {
    console.error('Second Opinion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze quote' },
      { status: 500 }
    );
  }
}
