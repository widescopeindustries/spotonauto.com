
export const maxDuration = 45;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey || '' });
const TEXT_MODEL = 'gemini-2.0-flash';

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

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing API Key' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { year, make, model, mechanicDiagnosis, quotedPrice, symptoms } = body;

    if (!year || !make || !model || !mechanicDiagnosis || !quotedPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: year, make, model, mechanicDiagnosis, quotedPrice' },
        { status: 400 }
      );
    }

    const price = parseFloat(quotedPrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
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
Mechanic's Diagnosis: ${mechanicDiagnosis}
Quoted Price: $${price.toFixed(2)}
${symptoms ? `Owner's Symptoms: ${symptoms}` : ''}

Provide your analysis as JSON with: verdict, confidence, avgPrice, priceRange (low/high), summary, flags, commonMisdiagnoses, questionsToAsk, alternatives, partsBreakdown.`;

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
    const data = JSON.parse(text);

    // Validate the verdict value
    const validVerdicts = ['Fair Price', 'Seems High', 'Red Flag', 'Seems Low'];
    if (!validVerdicts.includes(data.verdict)) {
      data.verdict = 'Fair Price';
    }

    return NextResponse.json({
      ...data,
      vehicle: { year, make, model },
      quotedPrice: price,
      mechanicDiagnosis,
    });
  } catch (error: any) {
    console.error('Second Opinion API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze quote' },
      { status: 500 }
    );
  }
}
