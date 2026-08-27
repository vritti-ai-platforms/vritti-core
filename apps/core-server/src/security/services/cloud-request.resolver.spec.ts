import type { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { generateSigningKeyPair, signRequestHeaders } from '@vritti/api-sdk/signing';
import type { VrittiCloudAuth } from 'fastify';
import { CloudRequestResolver } from './cloud-request.resolver';

const { privateKey, publicKey } = generateSigningKeyPair();

const PATH = '/apps/internal/app-1';
const BODY = JSON.stringify({ name: 'Storefront' });
const ORG_ID = 'org-1';

const sign = (orgId?: string) => signRequestHeaders({ method: 'PATCH', path: PATH, orgId, body: BODY }, privateKey);

function makeRequestService(headers: Record<string, string | undefined>) {
  return {
    getHeader: (key: string) => headers[key],
    getMethod: () => 'PATCH',
    getPath: () => PATH,
    getQuery: () => '',
    getRawBody: () => BODY,
    getHostname: () => 'shop.example.com',
    getAccessToken: () => null,
  } as unknown as Parameters<CloudRequestResolver['resolve']>[0];
}

const makeResolver = () => new CloudRequestResolver({ getOrThrow: () => publicKey } as unknown as ConfigService);

const emptyCloudAuth = () => ({ kind: 'cloud' }) as VrittiCloudAuth;

describe('CloudRequestResolver', () => {
  it('rejects a request with no signature headers', () => {
    expect(() => makeResolver().resolve(makeRequestService({ 'x-org-id': ORG_ID }), emptyCloudAuth())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a signature that does not match the body', () => {
    const service = makeRequestService({ ...sign(ORG_ID), 'x-org-id': ORG_ID });
    jest.spyOn(service, 'getRawBody').mockReturnValue(JSON.stringify({ name: 'Tampered' }));
    expect(() => makeResolver().resolve(service, emptyCloudAuth())).toThrow(UnauthorizedException);
  });

  // The org is a signed input, so swapping it in transit must invalidate the whole request.
  // This is what lets the established context be trusted by RlsInterceptor and the NATS resolver.
  it('rejects when x-org-id is swapped after signing', () => {
    const service = makeRequestService({ ...sign(ORG_ID), 'x-org-id': 'org-2' });
    expect(() => makeResolver().resolve(service, emptyCloudAuth())).toThrow(UnauthorizedException);
  });

  it('establishes the organization from a valid signed request', () => {
    const auth = emptyCloudAuth();
    makeResolver().resolve(makeRequestService({ ...sign(ORG_ID), 'x-org-id': ORG_ID }), auth);
    expect(auth.organizationId).toBe(ORG_ID);
  });

  // Deployment-wide (catalog license) and cross-tenant (media sweep) routes carry no org.
  // Routes that need one read it through @OrgId(), which throws when it is absent.
  it('authenticates a signed request that names no organization, leaving the org unset', () => {
    const auth = emptyCloudAuth();
    makeResolver().resolve(makeRequestService(sign()), auth);
    expect(auth.organizationId).toBeUndefined();
  });
});
