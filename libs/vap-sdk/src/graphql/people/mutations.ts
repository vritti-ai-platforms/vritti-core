import { graphql } from '../../gql';

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
