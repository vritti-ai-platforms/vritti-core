/**
 * The visitor-session cookie: a signed pointer at a row, not the row's contents.
 *
 * **Web Crypto only — no `node:crypto`, no Payload, no pg.** This runs in middleware, which Next
 * executes on the Edge runtime, and it is the reason minting is split from writing: middleware
 * guarantees a pointer exists, and the first server-side read creates the row it points at.
 *
 * **Why the signature, when the payload is one opaque id.** Without it, anyone could pre-set a `sid`
 * of their choosing, get a victim to land on it, and then read that victim's row — including the
 * `partyId` once they sign in. That is session fixation. Signing means only this code can mint a
 * pointer a server will act on; a forged one is discarded and replaced.
 *
 * The signature is not protecting the value from being *read*: the sid is meaningless on its own, and
 * holding it proves nothing. It is protecting where the sid came from.
 */

/** Cookie name. One per app, so two storefronts on sibling hosts never read each other's. */
export const VISITOR_COOKIE = 'vap-visitor';

/** 180 days. Long enough that a returning shopper keeps their store, short enough to lapse. */
export const VISITOR_TTL_SECONDS = 180 * 24 * 60 * 60;

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  // btoa is available on both the Edge and Node runtimes; Buffer is not available on the Edge.
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

/** A fresh `<sid>.<signature>`, with 32 bytes of entropy in the sid. */
export async function mintPointer(secret: string): Promise<string> {
  const sid = base64url(crypto.getRandomValues(new Uint8Array(32)));
  return `${sid}.${await hmac(sid, secret)}`;
}

/**
 * The sid a pointer names, or null when it is absent, malformed or not ours.
 *
 * One null for every failure, deliberately: a caller that cannot tell "forged" from "malformed" cannot
 * accidentally treat one of them as recoverable. Either way the answer is to mint a new one.
 */
export async function pointerSid(pointer: string | undefined, secret: string): Promise<string | null> {
  if (!pointer) return null;

  const separator = pointer.lastIndexOf('.');
  if (separator <= 0) return null;

  const sid = pointer.slice(0, separator);
  const presented = pointer.slice(separator + 1);
  const expected = await hmac(sid, secret);

  // Constant-time-ish: compare every byte regardless of where the first difference is. A length check
  // first would leak nothing useful here, but this costs nothing and keeps the shape honest.
  if (presented.length !== expected.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= presented.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0 ? sid : null;
}
