/** The client id core resolves the app — and therefore the tenant — from. */
export const CLIENT_ID_HEADER = 'x-vritti-client-id';

/**
 * The party a request acts for, when the caller names one.
 *
 * Scoping, not permission: it says who a request is made on behalf of, never what may be done. On the
 * signed transport it is covered by the signature, so it cannot be re-pointed at another customer in
 * transit — see `server/signing.ts`.
 */
export const PARTY_ID_HEADER = 'x-party-id';
