import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import type { App } from '@/db/schema';
import type { AppDomainRepository } from '../repositories/app.repository';
import { AppDomainService } from './app.service';

/**
 * Pins the grant sanitizer's keep/drop policy.
 *
 * The regression that motivates this file: the keep-condition once named only the web and
 * mobile buckets, so an API-only grant — the only shape the credential permission editor
 * actually sends — was silently discarded on save and the credential resolved to nothing.
 * Anything outside the four known buckets is dropped on write.
 */
describe('AppDomainService — setPermissions grant sanitizing', () => {
  const update = jest.fn();
  const repository = { update } as unknown as AppDomainRepository;
  const service = new AppDomainService(repository);

  const stored = () => update.mock.calls.at(-1)?.[1].permissions as FeatureUnlocks | undefined;

  beforeEach(() => {
    update.mockReset();
    update.mockImplementation(async (_id: string, values: Partial<App>) => ({ clientId: 'vca_x', ...values }) as App);
  });

  it('keeps a surface-only grant — the shape the credential editor sends', async () => {
    await service.setPermissions('a1', { people: { graphql: ['view', 'add'] } });
    expect(stored()).toEqual({ people: { graphql: ['view', 'add'] } });

    await service.setPermissions('a1', { people: { http: ['view'] } });
    expect(stored()).toEqual({ people: { http: ['view'] } });
  });

  it('drops an unknown bucket on write — only the four known surfaces are stored', async () => {
    // Inexpressible in the public types on purpose, hence the cast
    await service.setPermissions('a1', { people: { app: ['view'], graphql: ['view'] } } as never);
    expect(stored()).toEqual({ people: { graphql: ['view'] } });
  });

  it('keeps web/mobile grants as before', async () => {
    await service.setPermissions('a1', { people: { web: ['view'], mobile: ['view'] } });
    expect(stored()).toEqual({ people: { web: ['view'], mobile: ['view'] } });
  });

  it('preserves an empty array — view-only membership — while dropping bucketless features', async () => {
    await service.setPermissions('a1', {
      members: { graphql: [] },
      ghost: {},
    } as FeatureUnlocks);
    expect(stored()).toEqual({ members: { graphql: [] } });
  });

  it('drops malformed values and dedupes codes', async () => {
    await service.setPermissions('a1', {
      people: { http: ['view', 'view', 7 as unknown as string] },
      broken: 'nope' as unknown as FeatureUnlocks[string],
    });
    expect(stored()).toEqual({ people: { http: ['view'] } });
  });
});
