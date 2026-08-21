import type { MirroredUser, PayloadInstance } from './types';

/**
 * Mints a Payload session for a user this plugin has already authenticated against Vritti Cloud.
 *
 * The same three steps Payload's own login runs once it has checked a password: add a session to the
 * user, sign a JWT carrying its id, set the cookie. Since 3.4 sessions are a field ON the user document
 * (`users_sessions._parent_id → users.id` under postgres), so a cookie cannot exist without a row to
 * hang it on — which is why this plugin mirrors cloud members into the collection rather than
 * synthesising a user per request.
 *
 * payload is imported dynamically because it is ESM-only while this package emits CommonJS. TypeScript's
 * `module: Node16` leaves `import()` intact in that output, so this is a real dynamic import and not a
 * `require` in disguise.
 */
export async function issueSessionCookie(args: {
  payload: PayloadInstance;
  req: unknown;
  collectionSlug: string;
  user: MirroredUser;
}): Promise<string> {
  const { getFieldsToSign, jwtSign } = await import('payload');
  const { addSessionToUser, generatePayloadCookie } = await import('payload/shared');

  const { payload, req, collectionSlug, user } = args;
  const collectionConfig = payload.collections[collectionSlug]?.config;
  if (!collectionConfig) {
    throw new Error(`The ${collectionSlug} collection is not registered with Payload.`);
  }

  // Casts at the payload boundary only: these are payload's own runtime shapes, and naming them in this
  // package's built types is what the structural types above exist to avoid.
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
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  });

  return generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth as never,
    cookiePrefix: payload.config.cookiePrefix ?? 'payload',
    token,
  });
}
