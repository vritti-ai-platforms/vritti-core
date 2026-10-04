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

export const WishlistItemFieldsFragment = graphql(`
  fragment WishlistItemFields on WishlistItem {
    id
    catalogListingId
    offeringVariantId
    name
    sku
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

/**
 * Marks a listing, and says whether it was already marked.
 *
 * Idempotent — a second tap saves the same thing — so `alreadyExists` is what lets a caller say
 * "already in your wishlist" instead of claiming a save that did nothing.
 */
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

/** Which products the party has saved — ids only, for a product page's "Saved" state. */
export const WISHLIST_VARIANT_IDS_QUERY = graphql(`
  query WishlistVariantIds {
    wishlistVariantIds
  }
`);

/** The fields a party sees and edits on their own profile. */
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

/**
 * The signed-in party's own details.
 *
 * Takes no id: core reads the party from the request signature, so this answers "me" and there is
 * nothing to pass that could ask about somebody else.
 */
export const PARTY_PROFILE_QUERY = graphql(`
  query PartyProfile {
    partyProfile {
      ...PartyProfileFields
    }
  }
`);

/**
 * The party editing their own details.
 *
 * No phone: it is the credential they proved by OTP, and changing it is the OTP flow rather than a
 * field on a form. Answers the profile as it now stands, including the `displayName` core composes
 * from the names.
 */
export const UPDATE_PARTY_PROFILE = graphql(`
  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {
    updatePartyProfile(input: $input) {
      ...PartyProfileFields
    }
  }
`);

/** One of the party's saved addresses. */
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

/**
 * The party's address book.
 *
 * Every mutation answers the whole book rather than the row it touched: marking one address the
 * default unmarks another, so a single row would leave a caller redrawing a list it cannot see all
 * of.
 */
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
