import { NextRequest, NextResponse } from 'next/server';
import { generateRepairStepImage } from '@/services/geminiService';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { vehicle, instruction } = body;

    if (!vehicle || !instruction) {
      return NextResponse.json({ error: 'Missing vehicle or instruction' }, { status: 400 });
    }

    const imageUrl = await generateRepairStepImage(vehicle, instruction);

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Image Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
