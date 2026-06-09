import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  
  const correctPassword = process.env.DASHBOARD_PASSWORD;
  
  if (!correctPassword || password !== correctPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  
  const response = NextResponse.json({ success: true });
  
  // Set auth cookie - 8 hour expiry
  response.cookies.set('auth-session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours in seconds
    path: '/',
  });
  
  return response;
}
