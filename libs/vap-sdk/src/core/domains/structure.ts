import type { ApolloClient } from '@apollo/client';
import { APP_LEGAL_ENTITIES_QUERY, APP_SITES_QUERY } from '../graphql/structure';
import { requireData, run } from '../transport/errors';
import { type RequestContext, withoutWorkspace } from '../types';

/** How long a store list stays good for. Staff add outlets rarely; a stale minute costs nothing. */
const DEFAULT_STRUCTURE_CACHE_SECONDS = 300;

export type StructureSiteType = 'OUTLET' | 'WAREHOUSE' | 'PRODUCTION';

/** A legal entity this storefront may sell as. Its currency is what a session in it prices in. */
export type StructureLegalEntity = {
  id: string;
  code: string;
  name: string;
  /** ISO 4217, and the only place a currency is stated — a storefront configures none of its own. */
  currencyCode: string;
  country: string;
  sortOrder: number;
};

/** A store this storefront may sell from. */
export type StructureSite = {
  id: string;
  code: string;
  name: string;
  /** Only `OUTLET` sells to the public — a switcher should offer those alone. */
  type: StructureSiteType;
  timezone: string;
  /** Picking this store picks this entity, and therefore `currencyCode`. */
  legalEntityId: string;
  currencyCode: string;
  sortOrder: number;
};

/**
 * Where this storefront may sell from.
 *
 * The options source for a store switcher, and the authority a switch is validated against: a posted
 * site id means nothing until it appears here, and the legal entity and currency a session records are
 * taken from this answer rather than from the form that asked for the change.
 *
 * Needs no party — this is the shop's own shape, not a person's. Cached, because it changes when staff
 * open an outlet rather than when anybody shops.
 */
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
    /**
     * The stores this storefront sells from. One query, separately permissioned on core.
     *
     * Narrowed by the database, not by the caller: a type dropped after the fact was still read, sent
     * and cached. The response cache keys on the variables, so each set of types gets its own entry.
     *
     * Defaults to the types the deployment allows (`siteTypes`), so a storefront calls this bare and
     * gets what its operator chose in cloud rather than a list some component decided on. `types` here
     * overrides that, for a caller that genuinely wants something narrower. Empty either way means
     * every type.
     */
    sites(options: { types?: StructureSiteType[]; cacheSeconds?: number } = {}): Promise<StructureSite[]> {
      const types = options.types?.length ? options.types : allowedTypes;
      return read(APP_SITES_QUERY, (data) => (data as { appSites?: StructureSite[] } | undefined)?.appSites, {
        cacheSeconds: options.cacheSeconds,
        ...(types?.length ? { variables: { types } } : {}),
      });
    },

    /** The legal entities this storefront may sell as, each with the currency a session prices in. */
    legalEntities(options: { cacheSeconds?: number } = {}): Promise<StructureLegalEntity[]> {
      return read(
        APP_LEGAL_ENTITIES_QUERY,
        (data) => (data as { appLegalEntities?: StructureLegalEntity[] } | undefined)?.appLegalEntities,
        { cacheSeconds: options.cacheSeconds },
      );
    },

    /**
     * One store by id, or null — the check a switch runs before writing a session.
     *
     * Reads the cached list rather than asking core for one row, because a switcher has just rendered
     * that same list to be clicked.
     */
    async findSite(
      siteId: string,
      options: { types?: StructureSiteType[]; cacheSeconds?: number } = {},
    ): Promise<StructureSite | null> {
      const sites = await this.sites(options);
      return sites.find((site) => site.id === siteId) ?? null;
    },

    /** One legal entity by id, or null. The same check for a shop selling at entity level. */
    async findLegalEntity(
      legalEntityId: string,
      options: { cacheSeconds?: number } = {},
    ): Promise<StructureLegalEntity | null> {
      const entities = await this.legalEntities(options);
      return entities.find((entity) => entity.id === legalEntityId) ?? null;
    },
  };
}
