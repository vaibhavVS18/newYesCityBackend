import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ healthy: true, timestamp: Date.now() }, { status: 200 });
}
