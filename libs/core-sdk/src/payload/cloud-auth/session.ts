import type { MirroredUser, PayloadInstance } from './types';

// Mints a Payload session for a user this plugin has already authenticated against Vritti Cloud.
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
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  });

  return generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth as never,
    cookiePrefix: payload.config.cookiePrefix ?? 'payload',
    token,
  });
}
