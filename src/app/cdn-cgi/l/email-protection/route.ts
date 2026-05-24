import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.redirect('https://alloemmanuals.com/contact', 308);
}

export function HEAD() {
  return new NextResponse(null, {
    status: 308,
    headers: {
      Location: 'https://alloemmanuals.com/contact',
    },
  });
}

