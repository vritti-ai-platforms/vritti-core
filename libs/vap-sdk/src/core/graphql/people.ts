import { graphql } from '../gql';

/**
 * The person field set, shared by `createPerson` and anything that returns a party later.
 *
 * One fragment rather than the same field list written out per operation — the reason the
 * documents moved out of `people/operations.ts`.
 */
export const PersonFieldsFragment = graphql(`
  fragment PersonFields on Person {
    id
    displayName
    firstName
    lastName
    email
    phone
    isActive
  }
`);

/** The communication field set — `isPrimary` matters, since core decides it, not the caller. */
export const PersonCommunicationFieldsFragment = graphql(`
  fragment PersonCommunicationFields on PersonCommunication {
    id
    channel
    value
    isPrimary
    isActive
  }
`);

/**
 * Who is reachable at an email or phone, oldest party first.
 *
 * Whole records: a caller resolving somebody it has just authenticated needs their name, and a
 * second round-trip for it would be the common case rather than the exception. A list because one
 * address legitimately sits on several people.
 *
 * Deliberately never response-cached: this is the identity lookup, and a stale "nobody found"
 * would make `register` create a duplicate party for someone who already exists.
 */
export const PEOPLE_BY_COMMUNICATION_QUERY = graphql(`
  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {
    peopleByCommunication(input: $input) {
      ...PersonFields
    }
  }
`);

/** Creates the person plus their primary EMAIL and PHONE rows, in one transaction server-side. */
export const CREATE_PERSON = graphql(`
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      ...PersonFields
    }
  }
`);

/** Adds one communication — the `WEB_APP` reference, and the backfilled EMAIL/PHONE. */
export const ADD_PERSON_COMMUNICATION = graphql(`
  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {
    addPersonCommunication(input: $input) {
      ...PersonCommunicationFields
    }
  }
`);
