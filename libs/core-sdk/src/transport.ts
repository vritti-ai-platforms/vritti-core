import { signRequest } from './signing';
import { CoreError, type CoreSdkConfig } from './types';
import { type RequestContext, workspaceHeaders } from './workspaces';

/** The client id core resolves the app — and therefore the tenant — from. */
export const CLIENT_ID_HEADER = 'x-vritti-client-id';

/** The party a request acts for, when the app names one. */
export const PARTY_ID_HEADER = 'x-party-id';

type GraphqlError = {
  message?: string;
  extensions?: { label?: string; status?: number; code?: string };
};

/**
 * One signed GraphQL call to core.
 *
 * Every request carries an Ed25519 signature over method, path and body, which
 * core verifies against the public half of the app's keypair. That is what
 * authenticates the caller and establishes which organization it speaks for
 * — there is no bearer token and nothing replayable, since the signature covers
 * a timestamp core checks for skew.
 */
export type Transport = <T>(query: string, variables?: unknown) => Promise<T>;

export function createTransport(config: CoreSdkConfig, context: RequestContext = {}): Transport {
  const doFetch = config.fetch ?? globalThis.fetch;
  // Core signs over the pathname only; a query string would not match.
  const path = new URL(config.endpoint, 'http://placeholder').pathname;

  // Resolved once per transport: the scope is fixed for the life of a bound client, and
  // it has to be identical in the signature and on the wire.
  const scope = workspaceHeaders(context.workspace);
  // Annotated, not inferred: a bare ternary widens to a union carrying
  // `'x-party-id'?: undefined`, which HeadersInit refuses.
  const party: Record<string, string> = context.partyId ? { [PARTY_ID_HEADER]: context.partyId } : {};

  return async function request<T>(query: string, variables?: unknown): Promise<T> {
    // Serialized once so the signed bytes and the sent bytes are identical —
    // re-stringifying could reorder keys and invalidate the signature.
    const body = JSON.stringify({ query, variables });

    const response = await doFetch(config.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [CLIENT_ID_HEADER]: config.clientId,
        ...party,
        ...scope,
        // The context goes into the signature as well as onto the wire, so stripping or
        // re-pointing either one in transit invalidates the request.
        ...signRequest(
          { method: 'POST', path, body, partyId: context.partyId, workspaceHeaders: scope },
          config.privateKey,
        ),
      },
      body,
      cache: 'no-store',
    });

    if (!response.ok && response.status >= 500) {
      throw new CoreError('The store is unavailable right now.', undefined, response.status);
    }

    const payload = (await response.json()) as { data?: Record<string, T>; errors?: GraphqlError[] };
    const failure = payload.errors?.[0];

    if (failure) {
      throw new CoreError(
        failure.message ?? 'Something went wrong.',
        failure.extensions?.label ?? failure.extensions?.code,
        failure.extensions?.status,
      );
    }

    const data = payload.data;
    if (!data) throw new CoreError('Something went wrong.', undefined, undefined);

    // Every operation here returns exactly one root field.
    return Object.values(data)[0] as T;
  };
}
