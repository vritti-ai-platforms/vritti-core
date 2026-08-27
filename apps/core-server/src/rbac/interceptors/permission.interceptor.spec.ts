import { ForbiddenException } from '@vritti/api-sdk/exceptions';
import { of } from 'rxjs';
import { REQUIRE_FEATURE_KEY, SKIP_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';

// Stub only the barrel symbol the interceptor still needs, so its ESM-only `dinero.js` dep never loads under jest
jest.mock('@vritti/api-sdk', () => ({ PrimaryDatabaseService: class PrimaryDatabaseService {} }));

const mockGetRequest = jest.fn();
jest.mock('@/utils/request-context', () => ({ getRequest: (...args: unknown[]) => mockGetRequest(...args) }));
jest.mock('@/db/schema', () => ({ SessionTypeValues: { WEB: 'WEB', MOBILE: 'MOBILE' } }));
jest.mock('@/modules/domain/user-permissions/services/user-permissions.service', () => ({
  UserPermissionsDomainService: class {},
}));

import { PermissionInterceptor } from './permission.interceptor';

// biome-ignore lint/suspicious/noExplicitAny: test doubles for Nest primitives
type Any = any;

describe('PermissionInterceptor — @RequireFeature / @SkipFeature enforcement', () => {
  const NEXT = of('handler-result');
  let reflectorReturns: Record<string, unknown>;
  let userPermissions: {
    resolveEnabledPermissions: jest.Mock;
    resolveAvailableFeatures: jest.Mock;
  };
  let interceptor: PermissionInterceptor;
  let next: { handle: jest.Mock };

  const context = () => ({ getHandler: () => () => undefined, getClass: () => class {} }) as Any;

  beforeEach(() => {
    reflectorReturns = {};
    const reflector = { getAllAndOverride: (key: string) => reflectorReturns[key] } as Any;
    userPermissions = {
      resolveEnabledPermissions: jest.fn().mockResolvedValue(new Set<string>()),
      resolveAvailableFeatures: jest.fn().mockResolvedValue(new Set<string>()),
    };
    const primaryDb = { runWithRlsContext: jest.fn((_ctx: unknown, fn: () => unknown) => fn()) } as Any;
    interceptor = new PermissionInterceptor(reflector, userPermissions as Any, primaryDb);
    next = { handle: jest.fn().mockReturnValue(NEXT) };
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/commerce-api/categories/count',
      auth: { kind: 'session', userId: 'u1', siteId: 'b1', organizationId: 'o1', sessionType: 'WEB' },
    });
  });

  it('passes through when neither a permission nor a feature is required', async () => {
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(userPermissions.resolveAvailableFeatures).not.toHaveBeenCalled();
    expect(userPermissions.resolveEnabledPermissions).not.toHaveBeenCalled();
  });

  it('allows the route when the required feature switch is on', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['categories', 'uom']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith(
      { kind: 'user', userId: 'u1' },
      { scope: 'SITE', id: 'b1' },
      'web',
    );
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('denies the route (403) when the required feature switch is off', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['uom']));
    await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('bypasses the feature check entirely when @SkipFeature is present', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    reflectorReturns[SKIP_FEATURE_KEY] = true;
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveAvailableFeatures).not.toHaveBeenCalled();
  });

  it('a specific permission subsumes the feature switch — only the enabled set is resolved', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'categories.add';
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['categories.add']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledTimes(1);
    expect(userPermissions.resolveAvailableFeatures).not.toHaveBeenCalled();
  });

  it('denies (403) when the required permission is not in the enabled set', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'categories.add';
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['categories.view']));
    await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('resolves the mobile feature set for a MOBILE session', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/commerce-api/categories/count',
      auth: { kind: 'session', userId: 'u1', siteId: 'b1', organizationId: 'o1', sessionType: 'MOBILE' },
    });
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['categories']));
    await interceptor.intercept(context(), next as Any);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith(
      { kind: 'user', userId: 'u1' },
      { scope: 'SITE', id: 'b1' },
      'mobile',
    );
  });

  it('denies (403) when the session context is incomplete', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    mockGetRequest.mockReturnValue({ method: 'GET', url: '/x', auth: { kind: 'session', siteId: 'b1' } });
    await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(userPermissions.resolveAvailableFeatures).not.toHaveBeenCalled();
  });

  it('resolves a SITE_GROUP context when only x-sg-id was supplied', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'categories.add';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      auth: { kind: 'session', userId: 'u1', siteGroupId: 'g1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['categories.add']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
      { kind: 'user', userId: 'u1' },
      { scope: 'SITE_GROUP', id: 'g1' },
      'web',
    );
  });

  it('resolves an LE context when only x-le-id was supplied', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'ledger';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      auth: { kind: 'session', userId: 'u1', legalEntityId: 'le1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['ledger']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith(
      { kind: 'user', userId: 'u1' },
      { scope: 'LE', id: 'le1' },
      'web',
    );
  });

  it('falls back to the ORG context when no workspace header was supplied', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'dashboard';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      auth: { kind: 'session', userId: 'u1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['dashboard']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith(
      { kind: 'user', userId: 'u1' },
      { scope: 'ORG', id: 'o1' },
      'web',
    );
  });

  it('prefers SITE over broader contexts when several ids are present', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'categories.add';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      auth: {
        kind: 'session',
        userId: 'u1',
        siteId: 'b1',
        siteGroupId: 'g1',
        legalEntityId: 'le1',
        organizationId: 'o1',
        sessionType: 'WEB',
      },
    });
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['categories.add']));
    await interceptor.intercept(context(), next as Any);
    expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
      { kind: 'user', userId: 'u1' },
      { scope: 'SITE', id: 'b1' },
      'web',
    );
  });

  it('denies (403) when the required permission is missing in an ORG context', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'dashboard.edit';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      auth: { kind: 'session', userId: 'u1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['dashboard.view']));
    await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(next.handle).not.toHaveBeenCalled();
  });

  describe('app credentials', () => {
    // What AppRequestResolver puts on request.auth after a signature verifies
    const appRequest = (permissions: unknown, scope: Record<string, string> = {}) => ({
      method: 'POST',
      url: '/graphql',
      auth: {
        // The app IS the principal — named as itself, not standing in as a user
        kind: 'app',
        appId: 'app-1',
        organizationId: 'o1',
        appType: 'GRAPHQL',
        permissions,
        ...scope,
      },
    });

    // The grant source an app request must resolve through. Asserting on `kind: 'app'` is what
    // now proves the user path was not taken, since both share one method.
    const appSource = (grants: unknown) => ({ kind: 'app', appId: 'app-1', grants });

    it('resolves from the credential rather than from role assignments', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.add';
      mockGetRequest.mockReturnValue(appRequest({ people: { graphql: ['view', 'add'] } }));
      userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['org.people.add']));

      const res = await interceptor.intercept(context(), next as Any);

      expect(res).toBe(NEXT);
      expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
        appSource({ people: { graphql: ['view', 'add'] } }),
        { scope: 'ORG', id: 'o1' },
        'graphql',
      );
    });

    it('denies (403) a permission the credential was not granted', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.delete';
      mockGetRequest.mockReturnValue(appRequest({ people: { web: ['view'] } }));
      userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['org.people.view']));

      await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(next.handle).not.toHaveBeenCalled();
    });

    it('denies (403) an ungranted credential outright', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.add';
      mockGetRequest.mockReturnValue(appRequest({}));

      await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
        appSource({}),
        { scope: 'ORG', id: 'o1' },
        'graphql',
      );
    });

    it('treats a missing grant as an empty one rather than reaching the user path', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.add';
      mockGetRequest.mockReturnValue(appRequest(undefined));

      await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
        appSource({}),
        { scope: 'ORG', id: 'o1' },
        'graphql',
      );
    });

    it('gates on the feature switch when no specific permission is required', async () => {
      reflectorReturns[REQUIRE_FEATURE_KEY] = 'people';
      mockGetRequest.mockReturnValue(appRequest({ people: { web: ['view'] } }));
      userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['people']));

      const res = await interceptor.intercept(context(), next as Any);

      expect(res).toBe(NEXT);
      expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith(
        appSource({ people: { web: ['view'] } }),
        { scope: 'ORG', id: 'o1' },
        'graphql',
      );
    });

    it('honours the workspace scope the signed request named', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'site.people.view';
      mockGetRequest.mockReturnValue(appRequest({ people: { graphql: ['view'] } }, { siteId: 's1' }));
      userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['site.people.view']));

      await interceptor.intercept(context(), next as Any);

      expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
        appSource({ people: { graphql: ['view'] } }),
        { scope: 'SITE', id: 's1' },
        'graphql',
      );
    });

    it('resolves an app against its own surface bucket, never web or mobile', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.view';
      mockGetRequest.mockReturnValue(appRequest({ people: { graphql: ['view'] } }));
      userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['org.people.view']));

      await interceptor.intercept(context(), next as Any);

      expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'app' }),
        expect.anything(),
        'graphql',
      );
    });

    // The surface check fails closed: an app without a recognised credential type must resolve
    // nothing, not everything — resolution is never even attempted.
    it.each([undefined, 'SOAP'])('denies (403) an app whose type is %p', async (appType) => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.view';
      const request = appRequest({ people: { graphql: ['view'] } });
      request.auth.appType = appType as never;
      mockGetRequest.mockReturnValue(request);

      await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userPermissions.resolveEnabledPermissions).not.toHaveBeenCalled();
      expect(next.handle).not.toHaveBeenCalled();
    });

    it('an HTTP credential resolves the http bucket', async () => {
      reflectorReturns[REQUIRE_PERMISSION_KEY] = 'org.people.view';
      const request = appRequest({ people: { http: ['view'] } });
      request.auth.appType = 'HTTP';
      mockGetRequest.mockReturnValue(request);
      userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['org.people.view']));

      const res = await interceptor.intercept(context(), next as Any);

      expect(res).toBe(NEXT);
      expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'app' }),
        expect.anything(),
        'http',
      );
    });
  });
});
