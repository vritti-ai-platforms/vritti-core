import type { PayloadLike } from './runtime.js';

export interface IssuedSession {
  name: string;
  value: string;
  expiresAt: Date;
}

interface CollectionRuntime {
  slug: string;
  auth: { tokenExpiration: number };
}

// Mints a Payload session for a party this app has already authenticated some other way.
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
