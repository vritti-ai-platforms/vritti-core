import { graphql } from '../gql/index.js';

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

export const PersonCommunicationFieldsFragment = graphql(`
  fragment PersonCommunicationFields on PersonCommunication {
    id
    channel
    value
    isPrimary
    isActive
  }
`);

export const PEOPLE_BY_COMMUNICATION_QUERY = graphql(`
  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {
    peopleByCommunication(input: $input) {
      ...PersonFields
    }
  }
`);

export const CREATE_PERSON = graphql(`
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      ...PersonFields
    }
  }
`);

export const ADD_PERSON_COMMUNICATION = graphql(`
  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {
    addPersonCommunication(input: $input) {
      ...PersonCommunicationFields
    }
  }
`);

export const WishlistItemFieldsFragment = graphql(`
  fragment WishlistItemFields on WishlistItem {
    id
    catalogListingId
    name
    code
    isAvailable
    createdAt
    price {
      ...MoneyFields
    }
  }
`);

export const WISHLIST_QUERY = graphql(`
  query Wishlist($input: WishlistQueryInput!) {
    wishlist(input: $input) {
      ...WishlistItemFields
    }
  }
`);

export const ADD_TO_WISHLIST = graphql(`
  mutation AddToWishlist($input: WishlistRefInput!) {
    addToWishlist(input: $input) {
      alreadyExists
      wishlist {
        ...WishlistItemFields
      }
    }
  }
`);

export const REMOVE_FROM_WISHLIST = graphql(`
  mutation RemoveFromWishlist($input: WishlistRefInput!) {
    removeFromWishlist(input: $input) {
      ...WishlistItemFields
    }
  }
`);

export const WISHLIST_CODES_QUERY = graphql(`
  query WishlistCodes {
    wishlistCodes
  }
`);

export const PartyProfileFieldsFragment = graphql(`
  fragment PartyProfileFields on Person {
    id
    displayName
    firstName
    lastName
    email
    phone
  }
`);

export const PARTY_PROFILE_QUERY = graphql(`
  query PartyProfile {
    partyProfile {
      ...PartyProfileFields
    }
  }
`);

export const UPDATE_PARTY_PROFILE = graphql(`
  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {
    updatePartyProfile(input: $input) {
      ...PartyProfileFields
    }
  }
`);

export const PartyAddressFieldsFragment = graphql(`
  fragment PartyAddressFields on PartyAddress {
    id
    line1
    line2
    city
    region
    postalCode
    countryCode
    isDefault
  }
`);

export const PARTY_ADDRESSES_QUERY = graphql(`
  query PartyAddresses {
    partyAddresses {
      ...PartyAddressFields
    }
  }
`);

export const ADD_PARTY_ADDRESS = graphql(`
  mutation AddPartyAddress($input: PartyAddressInput!) {
    addPartyAddress(input: $input) {
      ...PartyAddressFields
    }
  }
`);

export const UPDATE_PARTY_ADDRESS = graphql(`
  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {
    updatePartyAddress(input: $input) {
      ...PartyAddressFields
    }
  }
`);

export const REMOVE_PARTY_ADDRESS = graphql(`
  mutation RemovePartyAddress($input: PartyAddressRefInput!) {
    removePartyAddress(input: $input) {
      ...PartyAddressFields
    }
  }
`);
