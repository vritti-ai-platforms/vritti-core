import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';

declare module 'fastify' {
  interface VrittiSessionInfo {
    organizationId: string;
    subdomain: string;

    /**
     * The person a signed app request is acting for, when it named one.
     *
     * Absent on staff requests, where the acting person *is* the user. Covered by the
     * request signature, so it cannot be swapped for another shopper in transit.
     */
    partyId?: string;

    /**
     * What a signed app request is allowed to do, carried from the credential.
     *
     * Set by `AppRequestResolver`, which has already loaded the app row to verify the
     * signature — so the permission interceptor spends no second query on it. Absent on
     * staff requests, where grants come from role assignments instead.
     *
     * A grant travelling with the request that authenticated it also means a revoked
     * permission takes effect on the next request, not whenever a cache expires.
     */
    appPermissions?: FeatureUnlocks;
    siteId?: string;
    siteGroupId?: string;
    legalEntityId?: string;
  }
}
