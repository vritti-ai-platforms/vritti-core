import { type NextRequest, NextResponse } from 'next/server';
import { mintPointer, pointerSid, VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';

/**
 * Gives every visitor a session pointer on their first request.
 *
 * **Why middleware at all.** A cookie cannot be set while rendering a server component —
 * `cookies().set()` throws outside a Server Action or Route Handler — so the one place a first-time
 * visitor can be handed a pointer is before the render.
 *
 * **It mints the pointer and nothing else.** No Payload, no database, no Node builtins: middleware
 * runs on the Edge runtime, and the row the pointer names is created by the first server-side read
 * that needs a workspace. Database writes are legal in a server component; only cookie mutation is
 * not. That split is what keeps this function Edge-safe.
 *
 * Wire it in the storefront's `src/middleware.ts` with a matcher that excludes `_next`, `/api`,
 * `/admin` and static assets — minting a pointer for an image request is pure waste.
 *
 * ```ts
 * export { vapSessionMiddleware as middleware } from '@vritti/vap-sdk/next/middleware';
 * export const config = {
 *   matcher: ['/((?!_next|api|admin|.*\\.[^/]+$).*)'],
 * };
 * ```
 */
export async function vapSessionMiddleware(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.PAYLOAD_SECRET;
  // The host owns its environment, so this reads the one variable Payload itself requires rather than
  // inventing a name. Without it there is nothing to sign with: pass the request through untouched
  // instead of handing out pointers nothing will accept.
  if (!secret) return NextResponse.next();

  const presented = request.cookies.get(VISITOR_COOKIE)?.value;
  if (await pointerSid(presented, secret)) return NextResponse.next();

  const pointer = await mintPointer(secret);

  // Set on the REQUEST as well as the response. Without the first, the render happening right now
  // still sees no cookie and would resolve the default — and anything it wrote would be attached to a
  // pointer the browser is only about to receive.
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
