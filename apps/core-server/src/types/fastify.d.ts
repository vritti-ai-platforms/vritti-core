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
    siteId?: string;
    siteGroupId?: string;
    legalEntityId?: string;
  }
}

export type {};
