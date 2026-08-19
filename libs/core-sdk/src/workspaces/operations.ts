import type { ApolloClient } from '@apollo/client';
import { requireData, run } from '../apollo/errors';
import { WORKSPACES_QUERY } from '../graphql/workspaces';
import type { RequestContext, Workspaces } from './types';

/**
 * How long a resolved scope list stays cacheable.
 *
 * An organization's structure — its sites, groups and legal entities — changes when an operator
 * changes it, which is rare and never mid-checkout. Five minutes keeps a chooser instant without
 * making a newly created site invisible for long.
 */
const LIST_TTL_SECONDS = 300;

/**
 * The scopes this app's organization has.
 *
 * Needed because core accepts a scope header but never tells a caller what the valid values are —
 * without this an app has to hardcode a site or legal-entity id. Pick one from here, pass it to
 * `forContext`, and the SDK turns the `kind` into the right header.
 *
 * The organization is never listed: it comes from the app credential, and organization scope is
 * expressed by sending no workspace header at all.
 *
 * This is the one operation that opts into the response cache. It is safe to serve slightly stale —
 * unlike the identity lookup, where a stale answer would create a duplicate party — and it is the
 * same answer for every shopper in a scope, so one entry serves them all.
 */
export function createWorkspacesOperations(client: ApolloClient, context: RequestContext = {}) {
  return {
    list: () =>
      run(() =>
        client
          .query({
            query: WORKSPACES_QUERY,
            context: { requestContext: context, responseCache: { ttlSeconds: LIST_TTL_SECONDS } },
          })
          .then((r) => requireData(r.data).workspaces as Workspaces),
      ),
  };
}

export type WorkspacesOperations = ReturnType<typeof createWorkspacesOperations>;
