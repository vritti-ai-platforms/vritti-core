import { generateSigningKeyPair, signRequestHeaders } from '@vritti/api-sdk/signing';
import type { FastifyRequest } from 'fastify';
import type { App } from '@/db/schema';
import type { AppDomainService } from '@/modules/domain/app/services/app.service';
import { AppRequestResolver } from './app-request.resolver';

const { privateKey, publicKey } = generateSigningKeyPair();

const CLIENT_ID = 'vca_0123456789abcdef0123456789abcdef';
const PATH = '/graphql';
const BODY = JSON.stringify({ query: 'mutation { createPerson { id } }' });
const ORG_ID = 'org-1';
const APP_ID = 'app-1';

function makeApp(overrides: Partial<App> = {}): App {
  return {
    id: APP_ID,
    organizationId: ORG_ID,
    clientId: CLIENT_ID,
    name: 'Storefront',
    type: 'GRAPHQL',
    signingKey: privateKey,
    signingPublicKey: publicKey,
    isActive: true,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as App;
}

const sign = (input: Record<string, unknown> = {}) =>
  signRequestHeaders({ method: 'POST', path: PATH, body: BODY, ...input }, privateKey);

/** Stands in for what the auth hook hands the resolver. */
function makeRequestService(
  headers: Record<string, string | undefined>,
  body: string | undefined = BODY,
  path = PATH,
  query = '',
) {
  return {
    getHeader: (key: string) => headers[key],
    getMethod: () => 'POST',
    getPath: () => path,
    getQuery: () => query,
    getRawBody: () => body,
    getHostname: () => 'shop.example.com',
    getAccessToken: () => null,
    getRefreshToken: () => null,
    getAllHeaders: () => headers,
  } as unknown as Parameters<AppRequestResolver['resolve']>[0];
}

function makeResolver(app: App | undefined, opts: { touched?: string[] } = {}) {
  const appService = {
    findByClientId: jest.fn().mockResolvedValue(app),
    touchLastUsed: jest.fn((id: string) => opts.touched?.push(id)),
  } as unknown as AppDomainService;

  return { resolver: new AppRequestResolver(appService), appService };
}

const emptySessionInfo = () => ({ sessionType: 'APP' }) as NonNullable<FastifyRequest['sessionInfo']>;

/** Every rejection must look identical — that is the security property under test. */
async function expectRejected(promise: Promise<unknown>, why: string) {
  await expect(promise).rejects.toMatchObject({ status: 401 });
  expect(why).toBeTruthy();
}

describe('AppRequestResolver', () => {
  describe('isAppRequest', () => {
    it('is true when a client id is presented', () => {
      const { resolver } = makeResolver(makeApp());
      expect(resolver.isAppRequest(makeRequestService({ 'x-vritti-client-id': CLIENT_ID }))).toBe(true);
    });

    it('is false for a session request', () => {
      const { resolver } = makeResolver(makeApp());
      expect(resolver.isAppRequest(makeRequestService({ authorization: 'Bearer x' }))).toBe(false);
    });
  });

  it('authenticates a correctly signed request and tenants it', async () => {
    const touched: string[] = [];
    const { resolver } = makeResolver(makeApp(), { touched });
    const sessionInfo = emptySessionInfo();

    await resolver.resolve(makeRequestService({ ...sign(), 'x-vritti-client-id': CLIENT_ID }), sessionInfo);

    expect(sessionInfo.organizationId).toBe(ORG_ID);
    expect(sessionInfo.appType).toBe('GRAPHQL');
    // The app stands in as the acting principal — there is no user behind the call.
    expect(sessionInfo.userId).toBe(APP_ID);
    expect(sessionInfo.sessionId).toBe(APP_ID);
    // Deliberately empty: nothing on the app path reads it, so no organization lookup
    // is paid for on every request.
    expect(sessionInfo.subdomain).toBe('');
    expect(touched).toEqual([APP_ID]);
  });

  it.each([
    ['no signature headers', { 'x-vritti-client-id': CLIENT_ID }],
    ['no client id', { ...sign() }],
  ])('refuses a request with %s', async (_label, headers) => {
    const { resolver } = makeResolver(makeApp());
    await expectRejected(resolver.resolve(makeRequestService(headers), emptySessionInfo()), _label);
  });

  it.each([
    ['an unknown client id', undefined],
    ['a suspended app', makeApp({ isActive: false })],
    ['a revoked app', makeApp({ revokedAt: new Date() })],
  ])('refuses %s', async (_label, app) => {
    const { resolver } = makeResolver(app);
    await expectRejected(
      resolver.resolve(makeRequestService({ ...sign(), 'x-vritti-client-id': CLIENT_ID }), emptySessionInfo()),
      _label,
    );
  });

  it('refuses a signature made with a different key', async () => {
    const other = generateSigningKeyPair();
    const headers = {
      ...signRequestHeaders({ method: 'POST', path: PATH, body: BODY }, other.privateKey),
      'x-vritti-client-id': CLIENT_ID,
    };
    const { resolver } = makeResolver(makeApp());
    await expectRejected(resolver.resolve(makeRequestService(headers), emptySessionInfo()), 'foreign signature');
  });

  it('refuses a tampered body carrying an otherwise valid signature', async () => {
    const { resolver } = makeResolver(makeApp());
    const request = makeRequestService(
      { ...sign(), 'x-vritti-client-id': CLIENT_ID },
      JSON.stringify({ query: 'mutation { somethingElse { id } }' }),
    );
    await expectRejected(resolver.resolve(request, emptySessionInfo()), 'tampered body');
  });

  it('refuses a timestamp outside the skew window', async () => {
    const stale = String(Math.floor(Date.now() / 1000) - 3600);
    const headers = { ...sign(), 'x-timestamp': stale, 'x-vritti-client-id': CLIENT_ID };
    const { resolver } = makeResolver(makeApp());
    await expectRejected(resolver.resolve(makeRequestService(headers), emptySessionInfo()), 'stale timestamp');
  });

  describe('signed request context', () => {
    it('accepts an unchanged query string', async () => {
      const query = 'search=salt&page=2';
      const headers = { ...sign({ query }), 'x-vritti-client-id': CLIENT_ID };
      const { resolver } = makeResolver(makeApp());
      const sessionInfo = emptySessionInfo();

      await resolver.resolve(makeRequestService(headers, BODY, PATH, query), sessionInfo);
      expect(sessionInfo.organizationId).toBe(ORG_ID);
    });

    it('refuses a query string altered in transit', async () => {
      const headers = { ...sign({ query: 'search=salt' }), 'x-vritti-client-id': CLIENT_ID };
      const { resolver } = makeResolver(makeApp());
      await expectRejected(
        resolver.resolve(makeRequestService(headers, BODY, PATH, 'search=sugar'), emptySessionInfo()),
        'tampered query',
      );
    });

    it('carries a signed party id onto the session', async () => {
      const partyId = 'party-uuid';
      const headers = { ...sign({ partyId }), 'x-vritti-client-id': CLIENT_ID, 'x-party-id': partyId };
      const { resolver } = makeResolver(makeApp());
      const sessionInfo = emptySessionInfo();

      await resolver.resolve(makeRequestService(headers), sessionInfo);
      expect(sessionInfo.partyId).toBe(partyId);
    });

    it('refuses a swapped party id', async () => {
      const headers = {
        ...sign({ partyId: 'party-uuid' }),
        'x-vritti-client-id': CLIENT_ID,
        'x-party-id': 'someone-else',
      };
      const { resolver } = makeResolver(makeApp());
      await expectRejected(resolver.resolve(makeRequestService(headers), emptySessionInfo()), 'swapped party');
    });

    it('accepts an unchanged workspace header', async () => {
      const workspaceHeaders = { 'x-le-id': 'le-uuid' };
      const headers = { ...sign({ workspaceHeaders }), 'x-vritti-client-id': CLIENT_ID, ...workspaceHeaders };
      const { resolver } = makeResolver(makeApp());
      const sessionInfo = emptySessionInfo();

      // The resolver only verifies it — applyContextHeaders, shared with the session
      // path, is what puts it on sessionInfo.
      await resolver.resolve(makeRequestService(headers), sessionInfo);
      expect(sessionInfo.organizationId).toBe(ORG_ID);
    });

    it('refuses the same workspace id moved to a different scope header', async () => {
      // Signing the header NAME is what stops a request being re-scoped from a site to
      // a legal entity with the id left untouched.
      const headers = {
        ...sign({ workspaceHeaders: { 'x-site-id': 'id-1' } }),
        'x-vritti-client-id': CLIENT_ID,
        'x-le-id': 'id-1',
      };
      const { resolver } = makeResolver(makeApp());
      await expectRejected(resolver.resolve(makeRequestService(headers), emptySessionInfo()), 're-scoped request');
    });

    it('refuses a workspace header added in transit', async () => {
      const headers = { ...sign(), 'x-vritti-client-id': CLIENT_ID, 'x-site-id': 'injected' };
      const { resolver } = makeResolver(makeApp());
      await expectRejected(resolver.resolve(makeRequestService(headers), emptySessionInfo()), 'injected scope');
    });
  });

  it('does not fail a valid request when last-used bookkeeping throws', async () => {
    const { resolver, appService } = makeResolver(makeApp());
    (appService.touchLastUsed as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('database is down');
    });

    // touchLastUsed is fire-and-forget by contract, so a throw here must not surface.
    const sessionInfo = emptySessionInfo();
    await expect(
      resolver.resolve(makeRequestService({ ...sign(), 'x-vritti-client-id': CLIENT_ID }), sessionInfo),
    ).resolves.toBeUndefined();
    expect(sessionInfo.organizationId).toBe(ORG_ID);
  });
});
