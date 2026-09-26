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

/**
 * The workspace scope a request acts in.
 *
 * Both are already members of `WORKSPACE_HEADER_ORDER`, so the signature covers them — and covers
 * the header *name*, which is what stops a request being re-pointed from a site to a legal entity
 * with the id left unchanged.
 */
export const SITE_ID_HEADER = 'x-site-id';
export const LEGAL_ENTITY_ID_HEADER = 'x-le-id';
