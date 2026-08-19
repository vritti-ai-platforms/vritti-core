import { graphql } from '../../gql';

/**
 * Who is reachable at an email or phone, oldest party first.
 *
 * Ids only — the caller is deciding *which* person, not rendering them. A list because one
 * address legitimately sits on several people.
 *
 * Deliberately never response-cached: this is the identity lookup, and a stale "nobody found"
 * would make `register` create a duplicate party for someone who already exists.
 */
export const PEOPLE_BY_COMMUNICATION_QUERY = graphql(`
  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {
    peopleByCommunication(input: $input)
  }
`);
