import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(_req: NextRequest) {
  const res = NextResponse.next()
  res.headers.delete('X-Frame-Options')   // remove SAMEORIGIN
  return res
}

export const config = { matcher: '/:path*' } 