import { createSignedClient } from './apollo/client';
import { type VapSdkOptions, resolveConfig } from './config';
import { createPeopleOperations } from './people/operations';
import type { RequestContext } from './workspaces';
import { createWorkspacesOperations } from './workspaces/operations';

/**
 * A client for the VAP API.
 *
 * Not storefront-specific: a shop, an appointment booking site and a partner
 * integration all speak to core the same way, so domains are named for what they
 * do rather than for who is calling. Customers, orders and appointments join as
 * they land, sharing the one signed transport built here.
 *
 * Distinct from `@vritti/api-sdk`, which is the *server* SDK for building Vritti
 * services. This one is what calls them, and carries no server dependencies.
 *
 * Configuration comes from `CORE_GRAPHQL_URL`, `APP_CLIENT_ID` and `APP_PRIVATE_KEY` unless it is
 * passed in, so the usual call takes no arguments at all.
 *
 * ```ts
 * const sdk = createVapSdk();
 * const { partyId } = await sdk.people.register(input, hooks);
 *
 * // Everything a signed-in shopper does, scoped to their store:
 * const scoped = sdk.forContext({ partyId, workspace: { kind: 'site', id: siteId } });
 * ```
 */
export function createVapSdk(options: VapSdkOptions = {}) {
  const config = resolveConfig(options);

  // One client for the life of the SDK. It caches nothing in memory — see `createSignedClient` — so
  // sharing it across requests and organizations is safe, and per-request identity travels as Apollo
  // context instead.
  const client = createSignedClient(config);

  const build = (context: RequestContext = {}) => ({
    people: createPeopleOperations(client, context),
    workspaces: createWorkspacesOperations(client, context),
  });

  return {
    ...build(),

    /** The Apollo client itself, for an operation no domain covers yet. */
    client,

    /**
     * The same operations, bound to a party and a workspace.
     *
     * Both travel as headers **and** inside the signature, so neither can be stripped
     * or re-pointed in transit. Registration deliberately uses the unbound client: it
     * runs before a party or a store exists.
     */
    forContext: (context: RequestContext) => build(context),
  };
}

export type VapSdk = ReturnType<typeof createVapSdk>;
