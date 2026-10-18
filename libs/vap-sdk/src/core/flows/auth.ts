import type { Channel, PeopleOperations, Person } from '../domains/people.js';
import { CHANNELS } from '../domains/people.js';
import type { SmsOtpOperations } from '../domains/sms-otp.js';
import type { WhatsappOtpOperations } from '../domains/whatsapp-otp.js';
import { PartyRollbackError, VapError } from '../errors.js';
import { isValidPhone, normalizePhone, toE164 } from '../phone.js';
import { OTP_CHANNELS, type OtpChannel, type SendOtpResult } from '../types.js';

export type RegisterPersonInput = {
  email: string;
  fullName: string;
  phone: string;
};

export type LocalRecord = { id: string | number };

export type RegisterPersonHooks<L extends LocalRecord> = {
  createLocal: () => Promise<L>;

  deleteLocal: (local: L) => Promise<void>;

  linkLocal: (local: L, party: { partyId: string; created: boolean }) => Promise<void>;
};

export type RegisterPersonResult<L extends LocalRecord> = {
  partyId: string;

  created: boolean;

  linked: boolean;

  linkError?: unknown;

  backfilled: Channel[];

  backfillErrors: unknown[];

  local: L;
};

export type OtpStep = 'phone' | 'code' | 'name';

export interface OtpFlowData {
  phone: string;
  channel: OtpChannel;
  verified: boolean;
  partyId?: string | null;
  displayName?: string | null;
  returnTo?: string | null;
  resendAt: number;
  codeExpiresAt: number;
  codeLength: number;
}

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
  invalidPhone: 'That does not look like a mobile number for the country you picked. Check it and try again.',
  tooSoon: 'A code was just sent. Wait a moment before asking for another.',
  unavailable: 'We could not sign you in just now. Try again in a moment.',
  expired: 'That took too long. Start again with your number.',
  missingCode: 'Enter the code we sent you.',
  invalidCode: 'That code is not right, or it has expired. Ask for a new one.',
  missingName: 'Tell us what to call you.',
};

export type OtpOutcome =
  // Persist `flow` wherever the adapter keeps it, then show `step`.
  | { status: 'flow'; flow: OtpFlowData; step: OtpStep }
  // The number is proven.
  | {
      status: 'signIn';
      phone: string;
      partyId: string | null;
      displayName: string | null;
      firstName?: string;
      returnTo: string | null;
    }
  // Re-render the form with this message, and focus `field` if one is named.
  | { status: 'error'; error: string; field?: string };

// Where a signed-out visitor is sent back to, and how.
export function safeReturnTo(requested: string | string[] | null | undefined): string | null {
  const path = Array.isArray(requested) ? requested[0] : requested;
  if (!path) return null;
  // Must be a path, and must not be protocol-relative.
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//') || path.startsWith('/\\')) return null;
  // A control character has no business in a URL, and one smuggled in — a newline especially — can split a header
  // downstream.
  for (const character of path) {
    const code = character.codePointAt(0) as number;
    if (code <= 0x1f || code === 0x7f) return null;
  }
  return path;
}

// Which step the caller is on, read entirely from the sealed state.
export function stepFromFlow(flow: OtpFlowData | null): OtpStep {
  if (!flow) return 'phone';
  return flow.verified ? 'name' : 'code';
}

// The identity sequences every web app shares.
export function createAuthFlows(
  people: PeopleOperations,
  whatsappOtp: WhatsappOtpOperations,
  smsOtp: SmsOtpOperations,
) {
  const say = (messages: OtpMessages | undefined, key: keyof OtpMessages): string => messages?.[key] || DEFAULTS[key];

  // Which domain a channel means.
  const channelOps = (channel: OtpChannel) => (channel === OTP_CHANNELS.SMS ? smsOtp : whatsappOtp);

  // The one place a contact detail is turned into a person.
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

  // Send a code, over whichever channel the caller asked for.
  async function sendOtp(phone: string, channel: OtpChannel = OTP_CHANNELS.WHATSAPP): Promise<SendOtpResult> {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new VapError('A phone number is required.', 'Invalid Phone', 400);
    return channelOps(channel).send(normalized);
  }

  // Check the code and, if it holds, say who the number belongs to.
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

    // Registers someone who signed up in this web app.
    async register<L extends LocalRecord>(
      input: RegisterPersonInput,
      hooks: RegisterPersonHooks<L>,
    ): Promise<RegisterPersonResult<L>> {
      const email = input.email.trim().toLowerCase();
      const phone = normalizePhone(input.phone);

      const local = await hooks.createLocal();

      let partyId: string;
      let created: boolean;
      try {
        const existing = await resolveParty({ email, phone });

        if (existing) {
          // The party itself is left alone — name, status, everything.
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

      const backfilled: Channel[] = [];
      const backfillErrors: unknown[] = [];
      if (!created) {
        // Ordered email-then-phone to match resolution order, so the channel that identified this person is the one
        // already on record by the time it runs.
        for (const [channel, value] of [
          [CHANNELS.EMAIL, email],
          [CHANNELS.PHONE, phone],
        ] as const) {
          if (!value) continue;
          try {
            await people.addCommunication(partyId, channel, value);
            backfilled.push(channel);
          } catch (error) {
            // The party already had it.
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

    // Turns a verified phone number into the party behind it, creating one if the organization has never seen it.
    async signInWithVerifiedPhone<L extends LocalRecord>(
      input: { phone: string; partyId?: string | null; displayName?: string | null; firstName?: string },
      hooks: {
        findLocal: (phone: string) => Promise<L | null>;
        createLocal: (party: { partyId: string; phone: string; displayName: string | null }) => Promise<L>;
        linkLocal: (local: L, partyId: string) => Promise<void>;
      },
    ): Promise<{ partyId: string; displayName: string | null; local: L; created: boolean }> {
      const phone = normalizePhone(input.phone);
      if (!phone) throw new VapError('A phone number is required to sign in.', 'Invalid Phone', 400);

      const matched = input.partyId ? null : await resolveParty({ phone });
      let partyId = input.partyId ?? matched?.id ?? null;
      // The party's own name wins over anything the caller collected: that record may have been curated by staff, and
      // signing in is not grounds to rewrite it.
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
        // Repairs the join on the way through: an account that lost its partyId gets it back on the next sign-in rather
        // than staying orphaned.
        await hooks.linkLocal(existing, partyId);
        return { partyId, displayName, local: existing, created };
      }

      const local = await hooks.createLocal({ partyId, phone, displayName });

      // Not fatal, and deliberately after the account exists: the party is signed in either way, and the reference is
      // core's record of which local account this party shops from.
      try {
        await people.addCommunication(partyId, CHANNELS.WEB_APP, String(local.id));
      } catch {
        // Already on record, or core is unreachable.
      }

      return { partyId, displayName, local, created };
    },

    // Step one of the three-request sign-in — send a code.
    async startOtpSignIn(input: {
      country: string;
      nationalNumber: string;
      channel?: OtpChannel;
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
        // Core refuses a resend inside the credential's cooldown.
        if (error instanceof VapError && error.status === 429) {
          return { status: 'error', error: say(input.messages, 'tooSoon') };
        }
        return { status: 'error', error: say(input.messages, 'unavailable') };
      }
    },

    // Step two — check the code, and find out who the number belongs to.
    async submitOtpCode(flow: OtpFlowData | null, code: string, messages?: OtpMessages): Promise<OtpOutcome> {
      if (!flow) return { status: 'error', error: say(messages, 'expired') };

      const entered = code.trim();
      if (!entered) {
        return { status: 'error', error: say(messages, 'missingCode'), field: 'code' };
      }

      try {
        const result = await verifyOtp(flow.phone, entered, flow.channel);
        // Every failure — wrong, expired, too many attempts, none outstanding — reads identically.
        if (!result.verified) {
          return { status: 'error', error: say(messages, 'invalidCode'), field: 'code' };
        }

        // Nobody holds this number yet, so a name is needed before a person can be made.
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

    // Step three — name a first-time party.
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

    // `stepFromFlow`, for a caller that already holds the flow.
    stepFromFlow,
  };
}

export type AuthFlows = ReturnType<typeof createAuthFlows>;

const ALREADY_ON_RECORD = 'Communication Exists';

// Whether a failed add simply means the value was already there.
function isAlreadyOnRecord(error: unknown): boolean {
  return error instanceof VapError && error.status === 409 && error.code === ALREADY_ON_RECORD;
}

// Splits a single name field into the first/last core expects.
function splitName(fullName: string): { firstName: string; lastName?: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const space = trimmed.indexOf(' ');
  if (space === -1) return { firstName: trimmed };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) };
  // Already on record, or core is unreachable.
  // Already on record, or core is unreachable. Neither is worth failing a sign-in over.
}
