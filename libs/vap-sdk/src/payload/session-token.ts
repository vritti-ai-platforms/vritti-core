import type { PayloadLike } from './runtime';

export interface IssuedSession {
  /** The cookie name Payload reads its token from, including this app's prefix. */
  name: string;
  value: string;
  expiresAt: Date;
}

interface CollectionRuntime {
  slug: string;
  auth: { tokenExpiration: number };
}

/**
 * Mints a Payload session for a shopper this app has already authenticated some other way.
 *
 * `payloadLogin` is the password path and `customers` has no password, so this does what a login does
 * *after* the credential check: records a session on the row and signs a token naming it. The JWT
 * strategy then looks that `sid` up in `user.sessions` on every request, exactly as it would for a
 * password login.
 *
 * Returns the cookie's parts rather than a serialised `Set-Cookie`, because the caller here is a Next
 * server action holding a `cookies()` store rather than something returning a Response.
 *
 * **Authenticate before calling this.** Nothing below checks anything — handing it a customer asserts
 * that whoever asked has already proved they are that customer.
 */
export async function issueSessionToken(args: {
  payload: PayloadLike;
  req: unknown;
  collection: string;
  user: { id: string | number; email?: string | null };
}): Promise<IssuedSession> {
  const { getFieldsToSign, jwtSign } = await import('payload');
  const { addSessionToUser } = await import('payload/shared');

  const { payload, req, collection, user } = args;
  const instance = payload as unknown as {
    secret: string;
    config: { cookiePrefix?: string };
    collections: Record<string, { config: CollectionRuntime }>;
  };

  const collectionConfig = instance.collections[collection]?.config;
  if (!collectionConfig) throw new Error(`The ${collection} collection is not registered with Payload.`);

  // Casts at the payload boundary only, to keep payload's shapes out of this package's built types.
  const { sid } = await addSessionToUser({
    collectionConfig: collectionConfig as never,
    payload: payload as never,
    req: req as never,
    user: user as never,
  });

  const fieldsToSign = getFieldsToSign({
    collectionConfig: collectionConfig as never,
    email: String(user.email ?? ''),
    sid,
    user: user as never,
  });

  const { token } = await jwtSign({
    fieldsToSign,
    secret: instance.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  });

  return {
    name: `${instance.config.cookiePrefix ?? 'payload'}-token`,
    value: token,
    expiresAt: new Date(Date.now() + collectionConfig.auth.tokenExpiration * 1000),
  };
}
