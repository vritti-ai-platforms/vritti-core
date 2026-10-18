// The visitor-session cookie: a signed pointer at a row, not the row's contents.

export const VISITOR_COOKIE = 'vap-visitor';

export const VISITOR_TTL_SECONDS = 180 * 24 * 60 * 60;

// The key the pointer is signed with: `PAYLOAD_SECRET`, raw.
export function pointerSecret(): string {
  return process.env.PAYLOAD_SECRET ?? '';
}

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

// A fresh `<sid>.<signature>`, with 32 bytes of entropy in the sid.
export async function mintPointer(secret: string): Promise<string> {
  const sid = base64url(crypto.getRandomValues(new Uint8Array(32)));
  return `${sid}.${await hmac(sid, secret)}`;
}

// The sid a pointer names, or null when it is absent, malformed or not ours.
export async function pointerSid(pointer: string | undefined, secret: string): Promise<string | null> {
  if (!pointer) return null;

  const separator = pointer.lastIndexOf('.');
  if (separator <= 0) return null;

  const sid = pointer.slice(0, separator);
  const presented = pointer.slice(separator + 1);
  const expected = await hmac(sid, secret);

  // Constant-time-ish: compare every byte regardless of where the first difference is.
  if (presented.length !== expected.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= presented.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0 ? sid : null;
}
