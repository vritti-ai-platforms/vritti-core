import type { ApolloClient } from '@apollo/client';
import { requireData, run } from '../apollo/errors';
import { ADD_PERSON_COMMUNICATION, CREATE_PERSON, PEOPLE_BY_COMMUNICATION_QUERY } from '../graphql/people';
import { PartyRollbackError, VapError } from '../types';
import type { RequestContext } from '../workspaces/types';
import {
  CHANNELS,
  type Channel,
  type CreatePersonInput,
  type LocalRecord,
  type Person,
  type PersonCommunication,
  type RegisterPersonHooks,
  type RegisterPersonInput,
  type RegisterPersonResult,
} from './types';

/**
 * People in the organization, and the registration flow built on top of them.
 *
 * The three primitives map one-to-one onto core's operations. `register` is the
 * generic every web app calls — it is the only place the signup sequence exists, so
 * a second storefront or an appointment site gets the same matching rules rather
 * than its own approximation of them.
 */
export function createPeopleOperations(client: ApolloClient, context: RequestContext = {}) {
  // The party and workspace ride as Apollo context, so one long-lived client serves every scope and
  // the signature is built per request from the headers that request carries.
  const requestContext = { requestContext: context };

  const findByCommunication = (channel: Channel, value: string) =>
    run(() =>
      client
        .query({
          query: PEOPLE_BY_COMMUNICATION_QUERY,
          variables: { input: { channel, value } },
          context: requestContext,
        })
        .then((r) => requireData(r.data).peopleByCommunication),
    );

  const create = (input: CreatePersonInput) =>
    run(() =>
      client
        .mutate({ mutation: CREATE_PERSON, variables: { input }, context: requestContext })
        .then((r) => requireData(r.data).createPerson as Person),
    );

  const addCommunication = (personId: string, channel: Channel, value: string) =>
    run(() =>
      client
        .mutate({
          mutation: ADD_PERSON_COMMUNICATION,
          variables: { input: { personId, channel, value } },
          context: requestContext,
        })
        .then((r) => requireData(r.data).addPersonCommunication as PersonCommunication),
    );

  return {
    findByCommunication,
    create,
    addCommunication,

    /**
     * Registers someone who signed up in this web app.
     *
     * ```ts
     * const { partyId, created } = await sdk.people.register(
     *   { email, phone, fullName },
     *   {
     *     createLocal: () => payload.create({ collection: 'customers', data: { … } }),
     *     deleteLocal: (c) => payload.delete({ collection: 'customers', id: c.id }),
     *     linkLocal: (c, { partyId }) =>
     *       payload.update({ collection: 'customers', id: c.id, data: { partyId } }),
     *   },
     * );
     * ```
     *
     * Resolution is email first, then phone. Email decides whenever it finds anyone,
     * because it is the credential this app authenticates on and is far more personal
     * than a number that may be a household line or a company switchboard. Phone only
     * gets a say when the email is new to the organization. Where several people share
     * an address the oldest wins — core already returns them oldest-first.
     *
     * Three outcomes, all distinguishable:
     *
     * - `createLocal` throws — rethrown untouched, and **core is never called**. This
     *   is where a duplicate email lands.
     * - core refuses — the local record is deleted and core's error is rethrown, so
     *   nothing is left anywhere. If the delete *also* fails, `PartyRollbackError` is
     *   thrown instead: that leaves an account that can sign in with no party behind
     *   it, the one state worth shouting about.
     * - the `WEB_APP` reference or `linkLocal` fails — **not** fatal. The person exists
     *   and can be resolved again by email, so this returns `linked: false` with the
     *   error attached rather than failing the signup.
     *
     * A matched party then gets any contact detail it was missing — matched by email
     * with no phone on file, matched by phone under a different email — reported in
     * `backfilled`. Existing values are never overwritten, and a failure here is
     * recorded in `backfillErrors` rather than raised.
     */
    async register<L extends LocalRecord>(
      input: RegisterPersonInput,
      hooks: RegisterPersonHooks<L>,
    ): Promise<RegisterPersonResult<L>> {
      const email = input.email.trim().toLowerCase();
      const phone = normalizePhone(input.phone);

      // Outside the try: a failure here means nothing exists yet, so there is nothing
      // to undo and the app's own error is the most useful thing to surface.
      const local = await hooks.createLocal();

      let partyId: string;
      let created: boolean;
      try {
        const existing = await resolveExisting(findByCommunication, email, phone);

        if (existing) {
          // The party itself is left alone — name, status, everything. This person may
          // have been curated by staff, and a web-app signup is not grounds to rewrite
          // that. Missing contact channels are added further down; nothing is replaced.
          partyId = existing;
          created = false;
        } else {
          const { firstName, lastName } = splitName(input.fullName);
          const person = await create({
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

      // Nothing below is fatal: the party exists and resolves by either channel, which
      // is all a retry needs.

      // A matched party may hold only the channel it was matched on — matched by email
      // with no phone on file, or matched by phone under a different email. Both details
      // were collected, so both get recorded. Contact details are only ever *added*: an
      // existing value is left alone, and core decides whether a new row takes an empty
      // primary slot, so a staff-curated primary is never re-pointed.
      //
      // Its own step rather than part of the block below, so a contact detail that fails
      // to land cannot cost us `linkLocal` — the partyId join matters more.
      const backfilled: Channel[] = [];
      const backfillErrors: unknown[] = [];
      if (!created) {
        // Ordered email-then-phone to match resolution order, so the channel that
        // identified this person is the one already on record by the time it runs.
        for (const [channel, value] of [
          [CHANNELS.EMAIL, email],
          [CHANNELS.PHONE, phone],
        ] as const) {
          if (!value) continue;
          try {
            await addCommunication(partyId, channel, value);
            backfilled.push(channel);
          } catch (error) {
            // The party already had it. That is the common case, not a problem.
            if (!isAlreadyOnRecord(error)) backfillErrors.push(error);
          }
        }
      }

      const outcome = { ...party, backfilled, backfillErrors };

      try {
        await addCommunication(partyId, CHANNELS.WEB_APP, String(local.id));
        await hooks.linkLocal(local, party);
      } catch (linkError) {
        return { ...outcome, linked: false, linkError, local };
      }

      return { ...outcome, linked: true, local };
    },
  };
}

export type PeopleOperations = ReturnType<typeof createPeopleOperations>;

/**
 * Core's label when a party already holds this value on this channel.
 *
 * Its source is `PartyCommunicationsDomainService.create` in commerce-service. Matched
 * on rather than inferred from the 409 alone, because that status also covers refusals
 * worth reporting.
 */
const ALREADY_ON_RECORD = 'Communication Exists';

/**
 * Whether a failed add simply means the value was already there.
 *
 * Adding blind and reading the answer off the error is what makes the backfill one code
 * path for every case: no lookup is needed to find out what a party is missing, and the
 * check cannot go stale between the read and the write.
 */
function isAlreadyOnRecord(error: unknown): boolean {
  return error instanceof VapError && error.status === 409 && error.code === ALREADY_ON_RECORD;
}

/** Email decides if it matches anyone; phone is only consulted when it does not. */
async function resolveExisting(
  findByCommunication: (channel: Channel, value: string) => Promise<string[]>,
  email: string,
  phone: string | null,
): Promise<string | undefined> {
  const byEmail = await findByCommunication(CHANNELS.EMAIL, email);
  if (byEmail.length > 0) return byEmail[0];

  if (!phone) return undefined;
  const byPhone = await findByCommunication(CHANNELS.PHONE, phone);
  return byPhone[0];
}

/**
 * Splits a single name field into the first/last core expects.
 *
 * Everything after the first space is the last name, which is wrong for some names
 * and right for most. Ask for the two fields separately if a web app needs better
 * than that — `create` takes them individually.
 */
function splitName(fullName: string): { firstName: string; lastName?: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const space = trimmed.indexOf(' ');
  if (space === -1) return { firstName: trimmed };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) };
}

/**
 * Strips formatting so the same number written two ways matches.
 *
 * Deliberately not full E.164 parsing — that needs a region to resolve a local
 * number, and core serves several. Keeping a leading `+` and digits only makes the
 * lookup consistent without silently guessing a country code onto someone's number.
 */
function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.trim().replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+') ? `+${digits.slice(1).replace(/\+/g, '')}` : digits.replace(/\+/g, '');
  return normalized || null;
}
