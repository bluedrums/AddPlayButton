import { NextResponse } from 'next/server'

export async function GET() {
  // Only show basic environment info, not sensitive data
  const envStatus = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json({
    message: 'Environment variables status',
    environment: envStatus,
    note: 'USDC address is masked for security'
  })
}
