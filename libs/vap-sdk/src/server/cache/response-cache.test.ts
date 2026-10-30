import { ApolloClient, ApolloLink, gql, InMemoryCache, Observable } from '@apollo/client';
import { beforeEach, describe, expect, it } from '@jest/globals';
import type { CachedResponse, ResponseCacheStore } from '../../core/transport/response-cache-store.js';
import { createResponseCacheLink } from './response-cache.js';

const LISTINGS = gql`
  query SiteCatalogListings($page: Int) {
    siteCatalogListings(page: $page) {
      total
    }
  }
`;

type Row = { result: unknown; fresh: boolean };

// One answer, then done — what core's HTTP link emits for a query.
const answer = (result: ApolloLink.Result) =>
  new Observable<ApolloLink.Result>((o) => {
    o.next(result);
    o.complete();
  });

// The store as the link sees it: whatever rows a test seeds, and a record of what the link wrote.
function memoryStore(rows: Record<string, Row> = {}) {
  const writes: Array<{ key: string; result: unknown; ttlSeconds: number }> = [];
  const store: ResponseCacheStore = {
    async get(key): Promise<CachedResponse | null> {
      return rows[key] ?? null;
    },
    async set(key, result, ttlSeconds) {
      writes.push({ key, result, ttlSeconds });
      rows[key] = { result, fresh: true };
    },
    async invalidate() {
      return 0;
    },
  };
  return { store, rows, writes };
}

// Core, as the terminating link: answers with `reply()` and counts how often it was asked.
function fakeCore() {
  const core = {
    calls: 0,
    reply: (): Observable<ApolloLink.Result> => answer({ data: { siteCatalogListings: { total: 3 } } }),
  };
  const link = new ApolloLink(() => {
    core.calls++;
    return core.reply();
  });
  return { core, link };
}

const coreDown = () => new Observable<ApolloLink.Result>((o) => o.error(new Error('ECONNREFUSED')));

function clientFor(store: ResponseCacheStore, coreLink: ApolloLink, defaultTtlSeconds?: number) {
  return new ApolloClient({
    link: ApolloLink.from([createResponseCacheLink(store, 'client_1', { defaultTtlSeconds }), coreLink]),
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'no-cache' } },
  });
}

const query = (client: ApolloClient, ttlSeconds?: number) =>
  client.query({ query: LISTINGS, variables: { page: 1 }, context: { responseCache: { ttlSeconds } } });

// The key the link derives for page 1 — read back off the first write.
async function keyFor(): Promise<string> {
  const { store, writes } = memoryStore();
  await query(clientFor(store, fakeCore().link));
  return writes[0].key;
}

const stale = { data: { siteCatalogListings: { __typename: 'X', total: 1 } } };

describe('response cache link', () => {
  let key: string;
  beforeEach(async () => {
    key = await keyFor();
  });

  it('serves a fresh row without asking core', async () => {
    const { store } = memoryStore({ [key]: { result: stale, fresh: true } });
    const { core, link } = fakeCore();
    const { data } = await query(clientFor(store, link));
    expect(core.calls).toBe(0);
    expect(data).toEqual(stale.data);
  });

  it('refreshes a stale row from core and stores the answer with the default TTL', async () => {
    const { store, writes } = memoryStore({ [key]: { result: stale, fresh: false } });
    const { core, link } = fakeCore();
    const { data } = await query(clientFor(store, link, 3600));
    expect(core.calls).toBe(1);
    expect(data).toEqual({ siteCatalogListings: { total: 3 } });
    expect(writes).toEqual([{ key, result: { data: { siteCatalogListings: { total: 3 } } }, ttlSeconds: 3600 }]);
  });

  it('serves the stale row when core is unreachable, and stops asking core for a while', async () => {
    const { store, writes } = memoryStore({ [key]: { result: stale, fresh: false } });
    const { core, link } = fakeCore();
    core.reply = coreDown;
    const client = clientFor(store, link);

    expect((await query(client)).data).toEqual(stale.data);
    expect((await query(client)).data).toEqual(stale.data);
    expect(core.calls).toBe(1);
    expect(writes).toHaveLength(0);
  });

  it('treats errors without data as core being down', async () => {
    const { store } = memoryStore({ [key]: { result: stale, fresh: false } });
    const { core, link } = fakeCore();
    core.reply = () => answer({ errors: [{ message: 'commerce service unavailable' }] } as ApolloLink.Result);
    expect((await query(clientFor(store, link))).data).toEqual(stale.data);
  });

  it('fails as before when core is down and nothing is stored', async () => {
    const { store } = memoryStore();
    const { core, link } = fakeCore();
    core.reply = coreDown;
    await expect(query(clientFor(store, link))).rejects.toThrow('ECONNREFUSED');
  });

  it('bypasses the store entirely for a TTL of 0', async () => {
    const { store, writes } = memoryStore({ [key]: { result: stale, fresh: true } });
    const { core, link } = fakeCore();
    await query(clientFor(store, link), 0);
    expect(core.calls).toBe(1);
    expect(writes).toHaveLength(0);
  });
});
