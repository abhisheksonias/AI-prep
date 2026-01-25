import { NextResponse } from 'next/server'

// Resume analysis health check disabled
export async function GET() {
  return NextResponse.json(
    { error: 'Resume analysis has been removed from this application.' },
    { status: 410 }
  )
}

