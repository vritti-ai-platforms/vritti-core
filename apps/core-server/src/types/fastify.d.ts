declare module 'fastify' {
  interface VrittiSessionInfo {
    organizationId: string;
    subdomain: string;
    siteId?: string;
    siteGroupId?: string;
    legalEntityId?: string;
  }
}

export type {};
