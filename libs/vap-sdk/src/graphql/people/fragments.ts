import { graphql } from '../../gql';

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
