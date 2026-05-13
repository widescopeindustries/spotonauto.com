import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = process.env.SPOTONAUTO_DATA_DIR || '/data/spotonauto';
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readWaitlist(): Promise<Array<{ email: string; vehicle: string; year: number | null; created_at: string }>> {
  try {
    const raw = await fs.readFile(WAITLIST_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeWaitlist(rows: Array<{ email: string; vehicle: string; year: number | null; created_at: string }>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(rows, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;
    let vehicle: string = '';
    let year: number | null = null;
    let kitSlug: string = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = body.email;
      vehicle = body.vehicle || '';
      year = body.year ?? null;
      kitSlug = body.kitSlug || '';
    } else {
      const form = await req.formData();
      email = form.get('email') as string;
      vehicle = (form.get('vehicle') as string) || '';
      const yearVal = form.get('year');
      year = yearVal ? parseInt(yearVal as string, 10) : null;
      kitSlug = (form.get('kitSlug') as string) || '';
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rows = await readWaitlist();
    const nextRow = {
      email: normalizedEmail,
      vehicle: typeof vehicle === 'string' ? vehicle.trim() : '',
      year: typeof year === 'number' && !isNaN(year) ? year : null,
      kitSlug: typeof kitSlug === 'string' ? kitSlug.trim() : '',
      source: 'kit_page',
      created_at: new Date().toISOString(),
    };

    const merged = [
      nextRow,
      ...rows.filter((row) => !(row.email === nextRow.email && row.vehicle === nextRow.vehicle)),
    ];

    await writeWaitlist(merged);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
