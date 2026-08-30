import type { OtpOperations } from '../domains/otp';
import type { Channel, PeopleOperations, Person } from '../domains/people';
import { CHANNELS } from '../domains/people';
import { PartyRollbackError, VapError } from '../errors';
import { normalizePhone } from '../phone';

/**
 * What a signup form collects.
 *
 * Both contact details are required, and that is policy rather than a data constraint: they are the
 * two channels `register` resolves a returning shopper by, so a signup missing one leaves the
 * organization unable to recognise them next time. The `createPerson` primitive still takes an
 * optional phone — an app that genuinely cannot ask for one calls that directly instead.
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
 * Everything else — matching order, normalization, when to undo, what counts as fatal — lives in
 * `register`, so a new web app supplies these three and cannot get the sequence wrong.
 *
 * The local record is created **first**, deliberately: core stores its id as the `WEB_APP` reference,
 * so the id has to exist before core is called. It also means the app's own unique-email constraint
 * rejects a duplicate before core is touched.
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
   * False when the organization already knew this person — usually because they registered at a
   * sibling web app under the same organization. Not an error.
   */
  created: boolean;

  /**
   * Whether `linkLocal` and the `WEB_APP` reference both landed.
   *
   * False means the party and the local account exist but are not fully joined up. Recoverable rather
   * than fatal: registering again resolves to the same party, so a retry completes it.
   */
  linked: boolean;

  /** Whatever failed when `linked` is false, so the caller can log it. */
  linkError?: unknown;

  /**
   * Channels written onto an existing party that was missing them.
   *
   * Empty when the party was just created and when it already held both. A channel appears here only
   * if a row was actually inserted, so this is a record of what the organization learned.
   */
  backfilled: Channel[];

  /** Failures while backfilling, which never fail a registration. */
  backfillErrors: unknown[];

  /** The record `createLocal` returned. */
  local: L;
};

/**
 * The identity sequences every web app shares.
 *
 * Domains call core; flows decide *policy* — which person a contact detail belongs to, what a signup
 * does when it matches nobody, when to undo. They live here rather than in each app so a second
 * storefront, a mobile micro-app or an appointment site gets the same answers rather than its own
 * approximation of them, and so the matching rule exists exactly once.
 *
 * Everything an app alone can do arrives as hooks, which is what keeps this tier free of Payload,
 * Next and React Native alike.
 */
export function createAuthFlows(people: PeopleOperations, otp: OtpOperations) {
  /**
   * The one place a contact detail is turned into a person.
   *
   * Email decides whenever it matches anyone, because it is the credential a web app typically
   * authenticates on and is far more personal than a number that may be a household line or a company
   * switchboard. Phone is consulted only when the email is new to the organization, or when there is
   * no email to consult — which is the phone-only case an OTP sign-in presents.
   *
   * Where several people share a value the oldest wins; core already returns them oldest-first.
   *
   * **Called by every flow below.** It was previously written twice — once in `register`, once in the
   * Payload party repair — which meant a repair could land on a different party than the signup that
   * should have created it.
   */
  async function resolveParty(input: { email?: string | null; phone?: string | null }): Promise<Person | undefined> {
    const email = input.email?.trim().toLowerCase();
    const phone = normalizePhone(input.phone);

    if (email) {
      const byEmail = await people.findByCommunication(CHANNELS.EMAIL, email);
      if (byEmail.length > 0) return byEmail[0];
    }

    if (!phone) return undefined;
    const byPhone = await people.findByCommunication(CHANNELS.PHONE, phone);
    return byPhone[0];
  }

  return {
    resolveParty,

    /**
     * Registers someone who signed up in this web app.
     *
     * Three outcomes, all distinguishable:
     *
     * - `createLocal` throws — rethrown untouched, and **core is never called**. This is where a
     *   duplicate email lands.
     * - core refuses — the local record is deleted and core's error is rethrown, so nothing is left
     *   anywhere. If the delete *also* fails, `PartyRollbackError` is thrown instead: that leaves an
     *   account that can sign in with no party behind it, the one state worth shouting about.
     * - the `WEB_APP` reference or `linkLocal` fails — **not** fatal. The person exists and can be
     *   resolved again, so this returns `linked: false` with the error attached.
     *
     * A matched party then gets any contact detail it was missing, reported in `backfilled`. Existing
     * values are never overwritten, and a failure there is recorded rather than raised.
     */
    async register<L extends LocalRecord>(
      input: RegisterPersonInput,
      hooks: RegisterPersonHooks<L>,
    ): Promise<RegisterPersonResult<L>> {
      const email = input.email.trim().toLowerCase();
      const phone = normalizePhone(input.phone);

      // Outside the try: a failure here means nothing exists yet, so there is nothing to undo and the
      // app's own error is the most useful thing to surface.
      const local = await hooks.createLocal();

      let partyId: string;
      let created: boolean;
      try {
        const existing = await resolveParty({ email, phone });

        if (existing) {
          // The party itself is left alone — name, status, everything. This person may have been
          // curated by staff, and a web-app signup is not grounds to rewrite that.
          partyId = existing.id;
          created = false;
        } else {
          const { firstName, lastName } = splitName(input.fullName);
          const person = await people.create({
            firstName,
            ...(lastName ? { lastName } : {}),
            email,
            ...(phone ? { phone } : {}),
          });
          partyId = person.id;
          created = true;
        }
      } catch (error) {
        try {
          await hooks.deleteLocal(local);
        } catch (rollbackError) {
          throw new PartyRollbackError(local.id, error, rollbackError);
        }
        throw error;
      }

      const party = { partyId, created };

      // Nothing below is fatal: the party exists and resolves by either channel, which is all a retry
      // needs.
      //
      // Its own step rather than part of the block below, so a contact detail that fails to land
      // cannot cost us `linkLocal` — the partyId join matters more.
      const backfilled: Channel[] = [];
      const backfillErrors: unknown[] = [];
      if (!created) {
        // Ordered email-then-phone to match resolution order, so the channel that identified this
        // person is the one already on record by the time it runs.
        for (const [channel, value] of [
          [CHANNELS.EMAIL, email],
          [CHANNELS.PHONE, phone],
        ] as const) {
          if (!value) continue;
          try {
            await people.addCommunication(partyId, channel, value);
            backfilled.push(channel);
          } catch (error) {
            // The party already had it. That is the common case, not a problem.
            if (!isAlreadyOnRecord(error)) backfillErrors.push(error);
          }
        }
      }

      const outcome = { ...party, backfilled, backfillErrors };

      try {
        await people.addCommunication(partyId, CHANNELS.WEB_APP, String(local.id));
        await hooks.linkLocal(local, party);
      } catch (linkError) {
        return { ...outcome, linked: false, linkError, local };
      }

      return { ...outcome, linked: true, local };
    },


    /**
     * Turns a verified phone number into the party behind it, creating one if the organization has
     * never seen it.
     *
     * The second half of an OTP sign-in. `otp.verify` establishes only that whoever asked holds the
     * number; this decides who that makes them, and hands the caller a `partyId` to attach its own
     * session to.
     *
     * `firstName` is required **only** when no party matches — the caller learns which case it is from
     * the `partyId` on the verify result, so it can collect a name before calling this rather than
     * asking everyone for one. Passing a name when a party already exists is ignored: that person may
     * have been curated by staff, and signing in is not grounds to rewrite their record.
     *
     * Deliberately does not verify the code itself. A code is single-use — core marks the row verified
     * and will not accept it twice — so re-verifying here would fail for every caller that split the
     * flow across requests, which is every browser. Carrying the verified fact between those requests
     * is the caller's job, and it must be carried somewhere a visitor cannot forge.
     */
    async completeOtpSignIn<L extends LocalRecord>(
      input: { phone: string; partyId?: string | null; displayName?: string | null; firstName?: string },
      hooks: {
        /** The app's own account for this number, oldest first, or null to create one. */
        findLocal: (phone: string) => Promise<L | null>;
        createLocal: (party: { partyId: string; phone: string; displayName: string | null }) => Promise<L>;
        linkLocal: (local: L, partyId: string) => Promise<void>;
      },
    ): Promise<{ partyId: string; displayName: string | null; local: L; created: boolean }> {
      const phone = normalizePhone(input.phone);
      if (!phone) throw new VapError('A phone number is required to sign in.', 'Invalid Phone', 400);

      // Trust the id the caller carried from verify when it has one, and fall back to resolving again.
      // The fallback matters: a party created between verify and this call — a second tab, a retry —
      // would otherwise be duplicated.
      const matched = input.partyId ? null : await resolveParty({ phone });
      let partyId = input.partyId ?? matched?.id ?? null;
      // The party's own name wins over anything the caller collected: that record may have been
      // curated by staff, and signing in is not grounds to rewrite it.
      let displayName = input.displayName ?? matched?.displayName ?? null;
      let created = false;

      if (!partyId) {
        if (!input.firstName?.trim()) {
          throw new VapError('A name is required to finish signing in.', 'Name Required', 400);
        }
        const person = await people.create({ firstName: input.firstName.trim(), phone });
        partyId = person.id;
        displayName = person.displayName;
        created = true;
      }

      const existing = await hooks.findLocal(phone);
      if (existing) {
        // Repairs the join on the way through: an account that lost its partyId gets it back on the
        // next sign-in rather than staying orphaned.
        await hooks.linkLocal(existing, partyId);
        return { partyId, displayName, local: existing, created };
      }

      const local = await hooks.createLocal({ partyId, phone, displayName });

      // Not fatal, and deliberately after the account exists: the shopper is signed in either way, and
      // the reference is core's record of which local account this party shops from.
      try {
        await people.addCommunication(partyId, CHANNELS.WEB_APP, String(local.id));
      } catch {
        // Already on record, or core is unreachable. Neither is worth failing a sign-in over.
      }

      return { partyId, displayName, local, created };
    },
  };
}

export type AuthFlows = ReturnType<typeof createAuthFlows>;

/**
 * Core's label when a party already holds this value on this channel.
 *
 * Its source is `PartyCommunicationsDomainService.create` in commerce-service. Matched on rather than
 * inferred from the 409 alone, because that status also covers refusals worth reporting.
 */
const ALREADY_ON_RECORD = 'Communication Exists';

/**
 * Whether a failed add simply means the value was already there.
 *
 * Adding blind and reading the answer off the error is what makes the backfill one code path for
 * every case: no lookup is needed to find out what a party is missing, and the check cannot go stale
 * between the read and the write.
 */
function isAlreadyOnRecord(error: unknown): boolean {
  return error instanceof VapError && error.status === 409 && error.code === ALREADY_ON_RECORD;
}

/**
 * Splits a single name field into the first/last core expects.
 *
 * Everything after the first space is the last name, which is wrong for some names and right for
 * most. Ask for the two fields separately if a web app needs better than that.
 */
function splitName(fullName: string): { firstName: string; lastName?: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const space = trimmed.indexOf(' ');
  if (space === -1) return { firstName: trimmed };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) };
}

