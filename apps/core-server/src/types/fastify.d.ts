import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';

declare module 'fastify' {
  // Augmented on the base, not per kind: every caller reaching this server acts for an
  // organization and may name a workspace, so `request.auth.organizationId` reads without
  // narrowing in RlsInterceptor, @OrgId() and the NATS resolver alike.
  interface VrittiAuthBase {
    // Optional because not every caller is org-scoped: the catalog license is deployment-wide and the media sweep spans every tenant, so a control-plane request may legitimately name no organization
    organizationId?: string;
    siteId?: string;
    siteGroupId?: string;
    legalEntityId?: string;
  }

  interface VrittiSessionAuth {
    subdomain: string;
  }

  interface VrittiAppAuth {
    // What the credential may do, carried from the app row
    permissions: FeatureUnlocks;

    // The person a signed app request is acting for, when it named one
    partyId?: string;
  }
}
