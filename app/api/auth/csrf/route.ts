import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const csrfToken = request.cookies.get('csrf-token')?.value;

  if (!csrfToken) {
    // This might happen if the user is not authenticated yet
    return NextResponse.json({ error: 'CSRF token not found' }, { status: 404 });
  }

  return NextResponse.json({ csrfToken });
}
