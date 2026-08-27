import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';

declare module 'fastify' {
  // Augmented on the base, not per kind: every caller reaching this server acts for an
  // organization and may name a workspace, so `request.auth.organizationId` reads without
  // narrowing in RlsInterceptor, @OrgId() and the NATS resolver alike.
  interface VrittiAuthBase {
    /**
     * Optional because not every caller is org-scoped: the catalog license is deployment-wide
     * and the media sweep spans every tenant, so a control-plane request may legitimately name
     * no organization. Sessions and apps always resolve one.
     *
     * Consumers that require it read through `@OrgId()`, which throws when it is absent —
     * enforced where it is used rather than assumed here.
     */
    organizationId?: string;
    siteId?: string;
    siteGroupId?: string;
    legalEntityId?: string;
  }

  interface VrittiSessionAuth {
    subdomain: string;
  }

  interface VrittiAppAuth {
    /**
     * What the credential may do, carried from the app row.
     *
     * The row is already loaded to verify the request signature, so `PermissionInterceptor`
     * gates without a second query — and a grant edited in cloud takes effect on the very
     * next request rather than whenever a cache expires.
     *
     * Deliberately absent from `VrittiSessionAuth`: a user's grants are not a grant set until
     * the nearest-wins walk collapses their assignments against a known node, so there is
     * nothing context-free to carry. See docs/auth-context-refactor-plan.md §2.5.
     */
    permissions: FeatureUnlocks;

    /**
     * The person a signed app request is acting for, when it named one.
     *
     * Absent on staff requests, where the acting person *is* the user. Covered by the
     * request signature, so it cannot be swapped for another shopper in transit.
     */
    partyId?: string;
  }
}
