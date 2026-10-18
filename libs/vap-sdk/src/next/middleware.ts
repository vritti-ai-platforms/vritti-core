import { type NextRequest, NextResponse } from 'next/server';
import { mintPointer, pointerSecret, pointerSid, VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';

// Gives every visitor a session pointer on their first request.
export async function vapSessionMiddleware(request: NextRequest): Promise<NextResponse> {
  const secret = pointerSecret();
  // The host owns its environment, so this reads the one variable Payload itself requires rather than inventing a name.
  if (!secret) return NextResponse.next();

  const presented = request.cookies.get(VISITOR_COOKIE)?.value;
  if (await pointerSid(presented, secret)) return NextResponse.next();

  const pointer = await mintPointer(secret);

  // Set on the REQUEST as well as the response.
  request.cookies.set(VISITOR_COOKIE, pointer);
  const response = NextResponse.next({ request });
  response.cookies.set(VISITOR_COOKIE, pointer, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: VISITOR_TTL_SECONDS,
  });
  return response;
}
