import type { Channel, PeopleOperations, Person } from '../domains/people';
import { CHANNELS } from '../domains/people';
import type { SmsOtpOperations } from '../domains/sms-otp';
import type { WhatsappOtpOperations } from '../domains/whatsapp-otp';
import { PartyRollbackError, VapError } from '../errors';
import { isValidPhone, normalizePhone, toE164 } from '../phone';
import { OTP_CHANNELS, type OtpChannel, type SendOtpResult } from '../types';

/**
 * What a signup form collects.
 *
 * Both contact details are required, and that is policy rather than a data constraint: they are the
 * two channels `register` resolves a returning party by, so a signup missing one leaves the
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
 * Which of the three forms a sign-in is on.
 *
 * `name` is reached only when the organization has never seen the number — a returning party goes
 * straight from `code` to signed in.
 */
export type OtpStep = 'phone' | 'code' | 'name';

/**
 * What has to survive between the three requests.
 *
 * Two of these fields are the authentication itself and must be unforgeable wherever the caller
 * parks them: `phone`, because re-reading it from a form would let a verified session be pointed at
 * someone else's number, and `verified`, because it *is* the proof. On a web app that means a signed
 * cookie (`seal` from `@vritti/vap-sdk/server`); on a device, encrypted storage.
 *
 * Deliberately not sealed here. This tier runs in Node, a browser and React Native alike, and
 * `node:crypto` exists in only one of them — so the state is handed over plain and the adapter
 * decides how to make it tamper-proof.
 */
export interface OtpFlowData {
  /** E.164, normalized once when the code was sent. Never re-read from a form after that. */
  phone: string;
  /** Which route the code took, so verifying asks the same one that sent it. */
  channel: OtpChannel;
  /** Only ever set true here, after core confirmed the code. */
  verified: boolean;
  /** The party behind the number once verified, or null when nobody is. */
  partyId?: string | null;
  /** The matched party's display name, so the name step is skipped for anyone core already knows. */
  displayName?: string | null;
  /** Where to land once signed in. Validated once, on entry — see `safeReturnTo`. */
  returnTo?: string | null;
  /** From core, so the code step can show the wait rather than discovering it as an error. */
  resendAt: number;
  /**
   * When the code stops being accepted, so the code step can count down to it.
   *
   * Epoch milliseconds, like `resendAt`. Advisory only — core decides what it still accepts, and a
   * countdown that has reached zero is never what refuses a code.
   *
   * **Not** `expiresAt`: a `SealedOtpFlow` is this interface *and* `SealedState`, whose `expiresAt`
   * is the cookie's own TTL, and `park` sets it last. Both are `number`, so the collision would
   * typecheck and the countdown would silently run to the cookie's expiry instead of the code's.
   */
  codeExpiresAt: number;
  /**
   * How many digits core issued, so the form draws exactly that many boxes.
   *
   * Carried in the flow rather than read per-render because it is a property of *this* code: the
   * credential's config could change between a send and the verify, and the boxes must match the
   * code actually in the party's hand.
   */
  codeLength: number;
}

/**
 * What to tell somebody when a step refuses.
 *
 * Every one is overridable because a storefront's wording belongs to whoever edits that storefront.
 * The defaults exist so a new app works before anybody has written copy, not as the final text.
 */
export type OtpMessages = {
  missingPhone?: string | null;
  invalidPhone?: string | null;
  tooSoon?: string | null;
  unavailable?: string | null;
  expired?: string | null;
  missingCode?: string | null;
  invalidCode?: string | null;
  missingName?: string | null;
};

const DEFAULTS: Required<{ [K in keyof OtpMessages]: string }> = {
  missingPhone: 'Enter your phone number.',
  invalidPhone:
    'That does not look like a mobile number for the country you picked. Check it and try again.',
  tooSoon: 'A code was just sent. Wait a moment before asking for another.',
  unavailable: 'We could not sign you in just now. Try again in a moment.',
  expired: 'That took too long. Start again with your number.',
  missingCode: 'Enter the code we sent you.',
  invalidCode: 'That code is not right, or it has expired. Ask for a new one.',
  missingName: 'Tell us what to call you.',
};

/**
 * What a step decided, and nothing about how to act on it.
 *
 * Three outcomes, so an adapter has no judgement left to make: carry on with this state at that
 * step, sign this person in, or show this message. Returning a bare boolean is what would push the
 * sequencing back into each app.
 */
export type OtpOutcome =
  /** Persist `flow` wherever the adapter keeps it, then show `step`. */
  | { status: 'flow'; flow: OtpFlowData; step: OtpStep }
  /** The number is proven. Hand this to `signInWithVerifiedPhone`, then discard the flow state. */
  | {
      status: 'signIn';
      phone: string;
      partyId: string | null;
      displayName: string | null;
      /** Collected at the name step. Absent for a returning party. */
      firstName?: string;
      returnTo: string | null;
    }
  /** Re-render the form with this message, and focus `field` if one is named. */
  | { status: 'error'; error: string; field?: string };

/**
 * Where a signed-out visitor is sent back to, and how.
 *
 * Only a **path on this site** survives. The value ends up as a redirect target, so an
 * attacker-supplied absolute URL — or the protocol-relative `//evil.example` that looks like a path
 * and is not — would turn a sign-in page into an open redirect. Anything that fails falls back to
 * null rather than erroring: a bad `next` is not worth refusing a sign-in over.
 */
export function safeReturnTo(requested: string | string[] | null | undefined): string | null {
  // A repeated query parameter arrives as an array, so `?next=/a&next=/b` comes through as one. The
  // first is the one the redirect that set it meant; unwrapping here spares every caller three
  // lines of framework trivia at a place that should read as a single idea.
  const path = Array.isArray(requested) ? requested[0] : requested;
  if (!path) return null;
  // Must be a path, and must not be protocol-relative. `/\` is the backslash variant some browsers
  // normalise into `//`, so it is rejected by the same rule.
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//') || path.startsWith('/\\')) return null;
  // A control character has no business in a URL, and one smuggled in — a newline especially — can
  // split a header downstream. Tested by code point rather than with a regex character class on
  // purpose: spelled as unicode escapes inside a class, a formatter rewrites them into the literal
  // control bytes they stand for, leaving an invisible range in a security check no reviewer can
  // read. Comparing numbers cannot be mangled that way.
  for (const character of path) {
    const code = character.codePointAt(0) as number;
    if (code <= 0x1f || code === 0x7f) return null;
  }
  return path;
}

/**
 * Which step the caller is on, read entirely from the sealed state.
 *
 * A total function of the flow, which is why the sign-in needs no `?step=` in the URL: absent state
 * is the phone form, unverified state is the code form, verified state is the name form. There is no
 * fourth possibility to reconcile.
 *
 * It used to take a requested step from the query string and override it from the cookie. That was
 * strictly more code for strictly less: a URL that could ask for a step it would never be given,
 * two routes per app to configure, and `/login?step=name` links that mean nothing to whoever
 * receives one. Deriving it removes the question instead of answering it.
 *
 * Standalone and pure, because the page that renders the form needs it as much as the action that
 * advances the flow, and a page should not have to construct the SDK to ask one question.
 */
export function stepFromFlow(flow: OtpFlowData | null): OtpStep {
  if (!flow) return 'phone';
  return flow.verified ? 'name' : 'code';
}

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
 *
 * ## Two ways in, one set of rules
 *
 * `sendOtp` / `verifyOtp` / `signInWithVerifiedPhone` are the primitives: three calls, no state
 * between them, for a surface that collects a whole number on one screen.
 *
 * `startOtpSignIn` / `submitOtpCode` / `submitOtpName` are the three-*request* browser sequence
 * built on those. They add what a form needs and the primitives have no business knowing:
 * `OtpFlowData` to carry between requests, overridable `OtpMessages`, and a `field` naming the
 * input to focus.
 *
 * ```ts
 * const out = await sdk.auth.startOtpSignIn({ country: 'IN', nationalNumber: '9000000000' })
 * if (out.status === 'flow') persist(out.flow)        // seal it, then render out.step
 * ```
 *
 * They were two modules until the split stopped paying: the sequence held no state of its own, so
 * it was a namespace rather than a layer, and `sendOtp` and friends already lived here — which left
 * the boundary at "OTP primitives here, OTP sequencing there", a line no caller ever wanted drawn.
 */
export function createAuthFlows(
  people: PeopleOperations,
  whatsappOtp: WhatsappOtpOperations,
  smsOtp: SmsOtpOperations,
) {
  const say = (messages: OtpMessages | undefined, key: keyof OtpMessages): string =>
    messages?.[key] || DEFAULTS[key];

  /** Which domain a channel means. The only place the two are chosen between. */
  const channelOps = (channel: OtpChannel) =>
    channel === OTP_CHANNELS.SMS ? smsOtp : whatsappOtp;

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

  /**
   * Send a code, over whichever channel the caller asked for.
   *
   * Here rather than on the domains because picking the channel is an auth decision, not a
   * WhatsApp or SMS one — and a caller that had to choose the module itself would be writing the
   * `if` this replaces. The number is normalized first, so the code goes to the same string
   * `verifyOtp` and `resolveParty` will later match on.
   *
   * A local function, like `resolveParty`, because `startOtpSignIn` below calls it. Reaching it
   * through `this` instead would work until the first caller destructured the object.
   */
  async function sendOtp(
    phone: string,
    channel: OtpChannel = OTP_CHANNELS.WHATSAPP,
  ): Promise<SendOtpResult> {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new VapError('A phone number is required.', 'Invalid Phone', 400);
    return channelOps(channel).send(normalized);
  }

  /**
   * Check the code and, if it holds, say who the number belongs to.
   *
   * ```ts
   * const { verified, partyId } = await sdk.auth.verifyOtp(phone, code, channel);
   * if (!verified) return wrongCode();
   * if (partyId) return signIn(partyId);   // returning party
   * return askForName();                   // new — then signInWithVerifiedPhone with a firstName
   * ```
   *
   * The lookup is a **second call, made only on success**, and that ordering is the security
   * property: core answers every failed code identically, so nothing here distinguishes a wrong
   * code from an expired one from a number with no code outstanding. Somebody enumerating phone
   * numbers gets `{ verified: false, partyId: null }` every time.
   *
   * It resolves through `resolveParty` rather than querying people itself. That is the whole
   * reason this moved out of the otp domain: the previous version ran its own
   * `peopleByCommunication` lookup **without normalizing the number first**, so a caller passing
   * a non-E.164 string got a different answer here than from every other party lookup in the SDK.
   */
  async function verifyOtp(
    phone: string,
    code: string,
    channel: OtpChannel = OTP_CHANNELS.WHATSAPP,
  ): Promise<{ verified: boolean; partyId: string | null; displayName: string | null }> {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new VapError('A phone number is required.', 'Invalid Phone', 400);

    const verified = await channelOps(channel).verify(normalized, code);
    if (!verified) return { verified: false, partyId: null, displayName: null };

    const match = await resolveParty({ phone: normalized });
    return { verified: true, partyId: match?.id ?? null, displayName: match?.displayName ?? null };
  }

  return {
    resolveParty,
    sendOtp,
    verifyOtp,

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
    async signInWithVerifiedPhone<L extends LocalRecord>(
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

      // Not fatal, and deliberately after the account exists: the party is signed in either way, and
      // the reference is core's record of which local account this party shops from.
      try {
        await people.addCommunication(partyId, CHANNELS.WEB_APP, String(local.id));
      } catch {
        // Already on record, or core is unreachable. Neither is worth failing a sign-in over.
      }

      return { partyId, displayName, local, created };
    },

    /**
     * Step one of the three-request sign-in — send a code.
     *
     * The country and the national number arrive separately so the form still works with JavaScript
     * off, and `toE164` applies that country's numbering plan, which is what strips the trunk zero
     * people type out of habit. Then the number is checked against the real plan rather than just
     * E.164's shape: every send costs money, and an impossible number comes back as a generic
     * delivery failure that tells the sender nothing.
     *
     * Use `sendOtp` instead on a surface that collects the whole number at once and has no flow
     * state to carry — a mobile screen that signs in without ever leaving it.
     */
    async startOtpSignIn(input: {
      country: string;
      nationalNumber: string;
      channel?: OtpChannel;
      /** The page they were on. Validated here and nowhere else. */
      next?: string | null;
      messages?: OtpMessages;
    }): Promise<OtpOutcome> {
      const national = input.nationalNumber.trim();
      if (!national) {
        return {
          status: 'error',
          error: say(input.messages, 'missingPhone'),
          field: 'nationalNumber',
        };
      }

      const phone = toE164(input.country, national);
      if (!isValidPhone(phone)) {
        return {
          status: 'error',
          error: say(input.messages, 'invalidPhone'),
          field: 'nationalNumber',
        };
      }

      const channel = input.channel ?? OTP_CHANNELS.WHATSAPP;
      try {
        const { resendAvailableAt, expiresAt, codeLength } = await sendOtp(phone, channel);
        return {
          status: 'flow',
          step: 'code',
          flow: {
            phone,
            channel,
            verified: false,
            returnTo: safeReturnTo(input.next),
            resendAt: new Date(resendAvailableAt).getTime(),
            codeExpiresAt: new Date(expiresAt).getTime(),
            codeLength,
          },
        };
      } catch (error) {
        // Core refuses a resend inside the credential's cooldown. That is the one failure worth
        // naming: it is the caller's own doing, and waiting fixes it.
        if (error instanceof VapError && error.status === 429) {
          return { status: 'error', error: say(input.messages, 'tooSoon') };
        }
        return { status: 'error', error: say(input.messages, 'unavailable') };
      }
    },

    /**
     * Step two — check the code, and find out who the number belongs to.
     *
     * A returning party never reaches step three: `verifyOtp` reports the party behind the number,
     * so only somebody the organization has genuinely never seen is asked for a name.
     *
     * `flow` null means the state lapsed or was never started. There is nothing to verify against,
     * and the number must **not** be taken from the form at this point.
     */
    async submitOtpCode(
      flow: OtpFlowData | null,
      code: string,
      messages?: OtpMessages,
    ): Promise<OtpOutcome> {
      if (!flow) return { status: 'error', error: say(messages, 'expired') };

      const entered = code.trim();
      if (!entered) {
        return { status: 'error', error: say(messages, 'missingCode'), field: 'code' };
      }

      try {
        const result = await verifyOtp(flow.phone, entered, flow.channel);
        // Every failure — wrong, expired, too many attempts, none outstanding — reads identically.
        // Saying which would tell a stranger whether a code is in flight for a number they do not
        // hold.
        if (!result.verified) {
          return { status: 'error', error: say(messages, 'invalidCode'), field: 'code' };
        }

        // Nobody holds this number yet, so a name is needed before a person can be made. The state
        // is handed back verified so the adapter re-seals it: the code is spent now, and this is
        // the only remaining proof the number was proven.
        if (!result.partyId) {
          return {
            status: 'flow',
            step: 'name',
            flow: { ...flow, verified: true, partyId: null, displayName: null },
          };
        }

        return {
          status: 'signIn',
          phone: flow.phone,
          partyId: result.partyId,
          displayName: result.displayName,
          returnTo: flow.returnTo ?? null,
        };
      } catch {
        return { status: 'error', error: say(messages, 'unavailable') };
      }
    },

    /**
     * Step three — name a first-time party.
     *
     * Guarded on the sealed `verified` flag rather than on having arrived at a URL, so reaching this
     * step by hand achieves nothing.
     *
     * It decides and validates; it does not write. The `signIn` outcome goes to
     * `signInWithVerifiedPhone`, which is what actually creates and links the party — the split is
     * what keeps every step above free of the app's own account record.
     */
    submitOtpName(flow: OtpFlowData | null, name: string, messages?: OtpMessages): OtpOutcome {
      if (!flow?.verified) return { status: 'error', error: say(messages, 'expired') };

      const firstName = name.trim();
      if (!firstName) {
        return { status: 'error', error: say(messages, 'missingName'), field: 'name' };
      }

      return {
        status: 'signIn',
        phone: flow.phone,
        partyId: flow.partyId ?? null,
        displayName: flow.displayName ?? null,
        firstName,
        returnTo: flow.returnTo ?? null,
      };
    },

    /** `stepFromFlow`, for a caller that already holds the flow. */
    stepFromFlow,
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
