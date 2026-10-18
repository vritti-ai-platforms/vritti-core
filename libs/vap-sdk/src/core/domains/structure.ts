import type { ApolloClient } from '@apollo/client';
import { APP_LEGAL_ENTITIES_QUERY, APP_SITES_QUERY } from '../graphql/structure.js';
import { requireData, run } from '../transport/errors.js';
import { type RequestContext, withoutWorkspace } from '../types.js';

const DEFAULT_STRUCTURE_CACHE_SECONDS = 300;

export type StructureSiteType = 'OUTLET' | 'WAREHOUSE' | 'PRODUCTION';

export type StructureLegalEntity = {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  country: string;
  sortOrder: number;
};

export type StructureSite = {
  id: string;
  code: string;
  name: string;
  type: StructureSiteType;
  timezone: string;
  legalEntityId: string;
  currencyCode: string;
  sortOrder: number;
};

// Where this storefront may sell from.
export function createStructureOperations(client: ApolloClient, context: RequestContext = {}, allowedTypes?: string[]) {
  // Org scope for both: no workspace header. Asking where one may sell is not asking from inside one.
  const read = <T>(
    query: typeof APP_SITES_QUERY | typeof APP_LEGAL_ENTITIES_QUERY,
    pick: (data: unknown) => T | null | undefined,
    options: { cacheSeconds?: number; variables?: Record<string, unknown> } = {},
  ): Promise<T> => {
    const ttlSeconds = options.cacheSeconds ?? DEFAULT_STRUCTURE_CACHE_SECONDS;
    return run(async () => {
      const result = await client.query({
        query,
        ...(options.variables ? { variables: options.variables } : {}),
        context: {
          requestContext: withoutWorkspace(context),
          ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
        },
      });
      return requireData(pick(result.data));
    });
  };

  return {
    // The stores this storefront sells from.
    sites(options: { types?: StructureSiteType[]; cacheSeconds?: number } = {}): Promise<StructureSite[]> {
      const types = options.types?.length ? options.types : allowedTypes;
      return read(APP_SITES_QUERY, (data) => (data as { appSites?: StructureSite[] } | undefined)?.appSites, {
        cacheSeconds: options.cacheSeconds,
        ...(types?.length ? { variables: { types } } : {}),
      });
    },

    // The legal entities this storefront may sell as, each with the currency a session prices in.
    legalEntities(options: { cacheSeconds?: number } = {}): Promise<StructureLegalEntity[]> {
      return read(
        APP_LEGAL_ENTITIES_QUERY,
        (data) => (data as { appLegalEntities?: StructureLegalEntity[] } | undefined)?.appLegalEntities,
        { cacheSeconds: options.cacheSeconds },
      );
    },

    // One store by id, or null — the check a switch runs before writing a session.
    async findSite(
      siteId: string,
      options: { types?: StructureSiteType[]; cacheSeconds?: number } = {},
    ): Promise<StructureSite | null> {
      const sites = await this.sites(options);
      return sites.find((site) => site.id === siteId) ?? null;
    },

    // One legal entity by id, or null.
    async findLegalEntity(
      legalEntityId: string,
      options: { cacheSeconds?: number } = {},
    ): Promise<StructureLegalEntity | null> {
      const entities = await this.legalEntities(options);
      return entities.find((entity) => entity.id === legalEntityId) ?? null;
    },
  };
}
