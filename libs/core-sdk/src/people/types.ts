/** The channels core recognises. `WEB_APP` is a reference, not a contact method. */
export const CHANNELS = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  WEB_APP: 'WEB_APP',
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];

/** A person party in the organization. */
export type Person = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

export type PersonCommunication = {
  id: string;
  channel: Channel;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type CreatePersonInput = {
  firstName: string;
  lastName?: string;
  /** Becomes the party's primary EMAIL communication, in the same transaction. */
  email?: string;
  /** Becomes the party's primary PHONE communication, in the same transaction. */
  phone?: string;
};

/**
 * A person registering through this web app.
 *
 * No organization: the tenant comes from the app credential signing the request,
 * so a web app cannot write into another organization's data even by mistake.
 */
/**
 * What a signup form collects.
 *
 * Both contact details are required, and that is policy rather than a data
 * constraint: they are the two channels `register` resolves a returning shopper by,
 * so a signup missing one leaves the organization unable to recognise them next time.
 * The `createPerson` primitive still takes an optional phone — an app that genuinely
 * cannot ask for one calls that directly instead.
 */
export type RegisterPersonInput = {
  email: string;
  fullName: string;
  phone: string;
};

/** The local account record a web app just created. It only has to have an id. */
export type LocalRecord = { id: string | number };

/**
 * The three things only the calling app can do.
 *
 * Everything else — matching order, normalization, when to undo, what counts as
 * fatal — lives in `register`, so a new web app supplies these three and cannot get
 * the sequence wrong.
 *
 * The local record is created **first**, deliberately: core stores its id as the
 * `WEB_APP` reference, so the id has to exist before core is called. It also means
 * the app's own unique-email constraint rejects a duplicate before core is touched.
 */
export type RegisterPersonHooks<L extends LocalRecord> = {
  /** Create the app's own account record. Throw to abort — core is not called. */
  createLocal: () => Promise<L>;

  /** Undo `createLocal`. Runs only when core refuses, and must leave nothing behind. */
  deleteLocal: (local: L) => Promise<void>;

  /** Store the resolved `partyId` against the local record. */
  linkLocal: (local: L, party: { partyId: string; created: boolean }) => Promise<void>;
};

export type RegisterPersonResult<L extends LocalRecord> = {
  /** The commerce party. Store this against the local account. */
  partyId: string;

  /**
   * False when the organization already knew this person — usually because they
   * registered at a sibling web app under the same organization. Not an error.
   */
  created: boolean;

  /**
   * Whether `linkLocal` and the `WEB_APP` reference both landed.
   *
   * False means the party and the local account exist but are not fully joined up.
   * Recoverable rather than fatal: registering again resolves to the same party, so
   * a retry completes it. Log it and let the person through.
   */
  linked: boolean;

  /** Whatever failed when `linked` is false, so the caller can log it. */
  linkError?: unknown;

  /**
   * Channels written onto an existing party that was missing them.
   *
   * Empty when the party was just created (both details went in with it) and when it
   * already held both. A channel appears here only if a row was actually inserted, so
   * this is a record of what the organization learned from this signup.
   */
  backfilled: Channel[];

  /**
   * Failures while backfilling, which never fail a registration.
   *
   * The party exists and resolves by either channel, so a missing contact row is worth
   * logging and no more. "Already on record" is not an error and is not reported here.
   */
  backfillErrors: unknown[];

  /** The record `createLocal` returned. */
  local: L;
};
