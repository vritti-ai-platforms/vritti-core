import { createHash, createPrivateKey, sign } from 'node:crypto';

export const WORKSPACE_HEADER_ORDER = ['x-site-id', 'x-sg-id', 'x-le-id', 'x-org-id'] as const;

export type SignInput = {
  method: string;
  path: string;
  body: string;
  query?: string;
  partyId?: string;
  workspaceHeaders?: Record<string, string>;
};

// Builds the string the signature is made over.
export function buildCanonical(input: SignInput, timestamp: number): string {
  const bodyHash = createHash('sha256').update(input.body).digest('hex');
  const lines = [input.method.toUpperCase(), input.path, '', bodyHash, String(timestamp)];

  if (input.query) lines.push(`query:${input.query}`);
  if (input.partyId) lines.push(`party:${input.partyId}`);
  for (const header of WORKSPACE_HEADER_ORDER) {
    const value = input.workspaceHeaders?.[header];
    if (value) lines.push(`${header}:${value}`);
  }

  return lines.join('\n');
}

// Signs with an Ed25519 private key (base64 pkcs8 DER), stamping the current unix time.
export function signRequest(
  input: SignInput,
  privateKeyBase64: string,
): { 'x-timestamp': string; 'x-signature': string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const canonical = buildCanonical(input, timestamp);
  const key = createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  return {
    'x-timestamp': String(timestamp),
    'x-signature': sign(null, Buffer.from(canonical, 'utf8'), key).toString('base64'),
  };
}
