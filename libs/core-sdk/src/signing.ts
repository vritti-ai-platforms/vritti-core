import { createHash, createPrivateKey, sign } from 'node:crypto';

/**
 * Request signing, deliberately reimplemented rather than imported.
 *
 * `@vritti/api-sdk/signing` has this exact function, but that package is the
 * *server* SDK — NestJS, Drizzle, Fastify — and this one is consumed by apps
 * that have none of it. Fifteen lines of `node:crypto` is a better trade than
 * that dependency tree.
 *
 * **The canonical string below is a wire format, not an implementation detail.**
 * `buildRequestCanonical` in api-sdk is the authority; core verifies against it.
 * If it ever changes there, it changes here in the same commit, or every signed
 * request from every client starts failing. The round-trip check in this
 * package's tests exists to catch exactly that drift.
 */
/**
 * The workspace-scope headers, in the order the canonical appends them.
 *
 * **Must stay identical to `WORKSPACE_HEADER_ORDER` in api-sdk's
 * `src/signing/request.ts`** — that is the authority. This package is deliberately
 * dependency-free so it can be installed anywhere, which is why the list is duplicated
 * rather than imported. Drift here means every signed request fails verification, and
 * the uniform 401 will not say why: the pinned canonical in `signing.test.ts` is what
 * catches it instead.
 */
const WORKSPACE_HEADER_ORDER = ['x-site-id', 'x-sg-id', 'x-le-id', 'x-org-id'] as const;

type SignInput = {
  method: string;
  path: string;
  body: string;
  query?: string;
  partyId?: string;
  workspaceHeaders?: Record<string, string>;
};

/**
 * Builds the string the signature is made over.
 *
 * ```
 * METHOD \n path \n orgId \n sha256hex(body) \n timestamp
 * [query:<raw>]  [party:<id>]  [<workspace-header>:<id>]
 * ```
 *
 * orgId is empty for an app request: core resolves the organization from the client id
 * rather than taking it from the caller. The optional lines are appended only when set,
 * so a bare request produces the same bytes it always has — and the workspace header's
 * **name** is signed, so re-scoping a request from a site to a legal entity cannot
 * survive even with the id unchanged.
 */
function buildCanonical(input: SignInput, timestamp: number): string {
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

/** Signs with an Ed25519 private key (base64 pkcs8 DER), stamping the current unix time. */
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
