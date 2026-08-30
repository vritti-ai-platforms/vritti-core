import type { ApolloClient } from '@apollo/client';
import { ADD_PERSON_COMMUNICATION, CREATE_PERSON, PEOPLE_BY_COMMUNICATION_QUERY } from '../graphql/people';
import { requireData, run } from '../transport/errors';
import type { RequestContext } from '../types';

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
 * The three people primitives, one call each.
 *
 * Deliberately thin — they map one-to-one onto core's operations and hold no policy. Deciding *which*
 * person a phone number belongs to, or what a signup should do when it matches nobody, lives in
 * `flows/auth.ts`, so every app that stands up gets the same answers rather than its own.
 */
export function createPeopleOperations(client: ApolloClient, context: RequestContext = {}) {
  // The party rides as Apollo context, so one long-lived client serves every caller and the
  // signature is built per request from the headers that request carries.
  const requestContext = { requestContext: context };

  return {
    /**
     * Who is reachable at this email or phone, oldest party first.
     *
     * Whole records, so a caller that has just authenticated somebody can greet them without a
     * second call. A list because one address legitimately sits on several people — a household
     * line, a shop counter. Choosing between them is policy, and belongs to the caller.
     */
    findByCommunication(channel: Channel, value: string): Promise<Person[]> {
      return run(() =>
        client
          .query({
            query: PEOPLE_BY_COMMUNICATION_QUERY,
            variables: { input: { channel, value } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).peopleByCommunication as Person[]),
      );
    },

    /** Creates the person plus their primary EMAIL and PHONE rows, in one transaction server-side. */
    create(input: CreatePersonInput): Promise<Person> {
      return run(() =>
        client
          .mutate({ mutation: CREATE_PERSON, variables: { input }, context: requestContext })
          .then((r) => requireData(r.data).createPerson as Person),
      );
    },

    /** Adds one communication — the `WEB_APP` reference, and the backfilled EMAIL/PHONE. */
    addCommunication(personId: string, channel: Channel, value: string): Promise<PersonCommunication> {
      return run(() =>
        client
          .mutate({
            mutation: ADD_PERSON_COMMUNICATION,
            variables: { input: { personId, channel, value } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).addPersonCommunication as PersonCommunication),
      );
    },
  };
}

export type PeopleOperations = ReturnType<typeof createPeopleOperations>;
