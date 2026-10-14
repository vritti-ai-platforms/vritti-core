import { generateKeyPairSync, verify } from 'node:crypto';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { buildCanonical, signRequest, WORKSPACE_HEADER_ORDER } from './signing';

/**
 * The request canonical is a wire format shared with core's verifier. The authority is
 * `buildRequestCanonical` in `@vritti/api-sdk/signing` (`src/signing/request.ts`); the strings pinned
 * below were produced by that function for the same inputs. If one of these fails, either this
 * package drifted — and every signed request would 401 — or api-sdk changed and this must change in
 * the same release.
 */

const BODY = JSON.stringify({ query: 'query Cart { cart { itemCount } }', variables: {} });

function keyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    secret: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
    publicKey,
  };
}

describe('request canonical (pinned to api-sdk buildRequestCanonical)', () => {
  it('matches api-sdk for a bare request', () => {
    expect(buildCanonical({ method: 'POST', path: '/graphql/app', body: '' }, 1700000000)).toBe(
      'POST\n/graphql/app\n\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n1700000000',
    );
  });

  it('matches api-sdk with query, party and workspace headers — in api-sdk order, not insertion order', () => {
    const canonical = buildCanonical(
      {
        method: 'post',
        path: '/graphql/app',
        body: BODY,
        query: 'a=1&b=2',
        partyId: 'party-1',
        workspaceHeaders: { 'x-le-id': 'le-1', 'x-site-id': 'site-1' },
      },
      1700000000,
    );
    expect(canonical).toBe(
      'POST\n/graphql/app\n\n52b560c885e7018cf019f40903babc0adb6a53e77053ae0a7b20ca8f5842a1f3\n1700000000\n' +
        'query:a=1&b=2\nparty:party-1\nx-site-id:site-1\nx-le-id:le-1',
    );
  });

  it('keeps the workspace header order api-sdk uses', () => {
    expect(WORKSPACE_HEADER_ORDER).toEqual(['x-site-id', 'x-sg-id', 'x-le-id', 'x-org-id']);
  });
});

describe('signRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('round-trips: the signature verifies over the canonical rebuilt from the stamped timestamp', () => {
    const { secret, publicKey } = keyPair();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000_123);

    const input = {
      method: 'POST',
      path: '/graphql/app',
      body: BODY,
      partyId: 'party-1',
      workspaceHeaders: { 'x-site-id': 's' },
    };
    const headers = signRequest(input, secret);

    expect(headers['x-timestamp']).toBe('1700000000');
    const canonical = buildCanonical(input, Number(headers['x-timestamp']));
    expect(verify(null, Buffer.from(canonical, 'utf8'), publicKey, Buffer.from(headers['x-signature'], 'base64'))).toBe(
      true,
    );
  });

  it('does not verify once the party is re-pointed', () => {
    const { secret, publicKey } = keyPair();
    const input = { method: 'POST', path: '/graphql/app', body: BODY, partyId: 'party-1' };
    const headers = signRequest(input, secret);

    const tampered = buildCanonical({ ...input, partyId: 'party-2' }, Number(headers['x-timestamp']));
    expect(verify(null, Buffer.from(tampered, 'utf8'), publicKey, Buffer.from(headers['x-signature'], 'base64'))).toBe(
      false,
    );
  });
});
