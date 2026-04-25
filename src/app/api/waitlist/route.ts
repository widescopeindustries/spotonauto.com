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
    const { email, vehicle, year } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rows = await readWaitlist();
    const nextRow = {
      email: normalizedEmail,
      vehicle: typeof vehicle === 'string' ? vehicle.trim() : '',
      year: typeof year === 'number' ? year : null,
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
