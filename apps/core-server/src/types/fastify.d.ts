import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';

declare module 'fastify' {
  interface VrittiAuthBase {
    organizationId?: string;
    siteId?: string;
    siteGroupId?: string;
    legalEntityId?: string;
  }

  interface VrittiSessionAuth {
    subdomain: string;
  }

  interface VrittiAppAuth {
    permissions: FeatureUnlocks;

    partyId?: string;
  }
}
