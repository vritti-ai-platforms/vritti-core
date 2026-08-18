import { createPeopleOperations } from './people/operations';
import { createTransport } from './transport';
import type { CoreSdkConfig } from './types';
import type { RequestContext } from './workspaces';
import { createWorkspacesOperations } from './workspaces/operations';

/**
 * A client for the Vritti core API.
 *
 * Not storefront-specific: a shop, an appointment booking site and a partner
 * integration all speak to core the same way, so domains are named for what they
 * do rather than for who is calling. Customers, orders and appointments join as
 * they land, sharing the one signed transport built here.
 *
 * Distinct from `@vritti/api-sdk`, which is the *server* SDK for building Vritti
 * services. This one is what calls them, and carries no server dependencies.
 *
 * ```ts
 * const sdk = createCoreSdk({ endpoint, clientId, privateKey });
 * const { partyId } = await sdk.people.register(input, hooks);
 *
 * // Everything a signed-in shopper does, scoped to their store:
 * const scoped = sdk.forContext({ partyId, workspace: { kind: 'site', id: siteId } });
 * ```
 */
export function createCoreSdk(config: CoreSdkConfig) {
  const build = (context: RequestContext = {}) => {
    const request = createTransport(config, context);
    return {
      people: createPeopleOperations(request),
      workspaces: createWorkspacesOperations(request),
      /** The raw signed transport, for an operation no domain covers yet. */
      request,
    };
  };

  return {
    ...build(),

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

export type CoreSdk = ReturnType<typeof createCoreSdk>;
