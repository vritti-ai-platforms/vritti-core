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
  let userPermissions: { resolveEnabledPermissions: jest.Mock; resolveAvailableFeatures: jest.Mock };
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
      sessionInfo: { userId: 'u1', siteId: 'b1', organizationId: 'o1', sessionType: 'WEB' },
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
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith('u1', { scope: 'SITE', id: 'b1' }, 'web');
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
      sessionInfo: { userId: 'u1', siteId: 'b1', organizationId: 'o1', sessionType: 'MOBILE' },
    });
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['categories']));
    await interceptor.intercept(context(), next as Any);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith('u1', { scope: 'SITE', id: 'b1' }, 'mobile');
  });

  it('denies (403) when the session context is incomplete', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'categories';
    mockGetRequest.mockReturnValue({ method: 'GET', url: '/x', sessionInfo: { siteId: 'b1' } });
    await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(userPermissions.resolveAvailableFeatures).not.toHaveBeenCalled();
  });

  it('resolves a SITE_GROUP context when only x-sg-id was supplied', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'categories.add';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      sessionInfo: { userId: 'u1', siteGroupId: 'g1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['categories.add']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith(
      'u1',
      { scope: 'SITE_GROUP', id: 'g1' },
      'web',
    );
  });

  it('resolves an LE context when only x-le-id was supplied', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'ledger';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      sessionInfo: { userId: 'u1', legalEntityId: 'le1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['ledger']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith('u1', { scope: 'LE', id: 'le1' }, 'web');
  });

  it('falls back to the ORG context when no workspace header was supplied', async () => {
    reflectorReturns[REQUIRE_FEATURE_KEY] = 'dashboard';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      sessionInfo: { userId: 'u1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveAvailableFeatures.mockResolvedValue(new Set(['dashboard']));
    const res = await interceptor.intercept(context(), next as Any);
    expect(res).toBe(NEXT);
    expect(userPermissions.resolveAvailableFeatures).toHaveBeenCalledWith('u1', { scope: 'ORG', id: 'o1' }, 'web');
  });

  it('prefers SITE over broader contexts when several ids are present', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'categories.add';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      sessionInfo: {
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
    expect(userPermissions.resolveEnabledPermissions).toHaveBeenCalledWith('u1', { scope: 'SITE', id: 'b1' }, 'web');
  });

  it('denies (403) when the required permission is missing in an ORG context', async () => {
    reflectorReturns[REQUIRE_PERMISSION_KEY] = 'dashboard.edit';
    mockGetRequest.mockReturnValue({
      method: 'GET',
      url: '/x',
      sessionInfo: { userId: 'u1', organizationId: 'o1', sessionType: 'WEB' },
    });
    userPermissions.resolveEnabledPermissions.mockResolvedValue(new Set(['dashboard.view']));
    await expect(interceptor.intercept(context(), next as Any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(next.handle).not.toHaveBeenCalled();
  });
});
