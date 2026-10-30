import { generateKeyPairSync, type KeyObject, sign } from 'node:crypto';
import { describe, expect, it } from '@jest/globals';
import type { ResponseCacheStore } from '../core/transport/response-cache-store.js';
import { cacheClearEndpoint } from './cache.js';

const { privateKey } = generateKeyPairSync('ed25519');
const clientSecret = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');

// A request as core sends it: the body, signed over `${timestamp}.${rawBody}`.
function signedRequest(body: unknown, key: KeyObject = privateKey) {
  const rawBody = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(null, Buffer.from(`${timestamp}.${rawBody}`, 'utf8'), key).toString('base64');
  return {
    text: async () => rawBody,
    headers: new Headers({ 'x-vap-event-id': 'evt_1', 'x-vap-timestamp': timestamp, 'x-vap-signature': signature }),
  };
}

function recordingStore() {
  const prefixes: string[] = [];
  const store: ResponseCacheStore = {
    get: async () => null,
    set: async () => undefined,
    invalidate: async (prefix) => {
      prefixes.push(prefix);
      return 2;
    },
  };
  return { store, prefixes };
}

async function call(store: ResponseCacheStore, req: unknown) {
  const response = (await cacheClearEndpoint({ clientSecret, store }).handler(req as never)) as Response;
  return { status: response.status, body: await response.json() };
}

describe('cache clear endpoint', () => {
  it('clears the named operations, each by its exact name', async () => {
    const { store, prefixes } = recordingStore();
    const res = await call(store, signedRequest({ operations: ['SiteCatalogListings', 'SiteCatalogListingByCode'] }));
    expect(res).toEqual({ status: 200, body: { cleared: 4 } });
    expect(prefixes).toEqual(['SiteCatalogListings:', 'SiteCatalogListingByCode:']);
  });

  it('clears everything when no operations are named', async () => {
    const { store, prefixes } = recordingStore();
    expect((await call(store, signedRequest({}))).status).toBe(200);
    expect(prefixes).toEqual(['']);
  });

  it('refuses a request core did not sign', async () => {
    const { store, prefixes } = recordingStore();
    const other = generateKeyPairSync('ed25519').privateKey;
    expect((await call(store, signedRequest({}, other))).status).toBe(401);
    expect(prefixes).toHaveLength(0);
  });

  it('rejects operations that are not names', async () => {
    const { store, prefixes } = recordingStore();
    expect((await call(store, signedRequest({ operations: [''] }))).status).toBe(400);
    expect(prefixes).toHaveLength(0);
  });
});
