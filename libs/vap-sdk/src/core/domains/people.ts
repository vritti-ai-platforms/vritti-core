import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import {
  ADD_PARTY_ADDRESS,
  ADD_PERSON_COMMUNICATION,
  ADD_TO_WISHLIST,
  CREATE_PERSON,
  PARTY_ADDRESSES_QUERY,
  PARTY_PROFILE_QUERY,
  PEOPLE_BY_COMMUNICATION_QUERY,
  REMOVE_FROM_WISHLIST,
  REMOVE_PARTY_ADDRESS,
  UPDATE_PARTY_ADDRESS,
  UPDATE_PARTY_PROFILE,
  WISHLIST_QUERY,
  WISHLIST_VARIANT_IDS_QUERY,
} from '../graphql/people';
import { requireData, run } from '../transport/errors';
import { type Money, type RequestContext, withoutWorkspace } from '../types';

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
/** One of the party's saved addresses. */
export type PartyAddress = {
  id: string;
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  /** Where orders go unless told otherwise. Marking one default unmarks the previous one. */
  isDefault: boolean;
};

/** An address as a party writes it. Clearing an optional field means sending `null`. */
export type PartyAddressInput = {
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  isDefault?: boolean;
};

/** The party's own details, as their profile page shows them. */
export type PartyProfile = {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

/** What a party may change about themselves. Phone is absent — that is the OTP flow. */
export type PartyProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/** What `addToWishlist` answers with — the list, plus whether it was already there. */
export type WishlistAddResult = {
  alreadyExists: boolean;
  wishlist: WishlistItem[];
};

export type WishlistItem = {
  id: string;
  catalogListingId: string;
  /** What a storefront joins its own product page on — the variant, stable across sites. */
  offeringVariantId: string;
  name: string;
  sku: string | null;
  price: Money | null;
  isAvailable: boolean;
  createdAt: string;
};

export function createPeopleOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  // The party rides as Apollo context, so one long-lived client serves every caller and the
  // signature is built per request from the headers that request carries.
  const requestContext = { requestContext: context };
  // A wishlist is the person's across the whole organization, so its calls carry no workspace.
  const wishlistContext = { requestContext: withoutWorkspace(context) };

  /**
   * Refused here rather than at core, so a caller that forgot `forContext` gets a message naming the
   * mistake instead of a uniform "sign in" from the far end of a signed request.
   *
   * Only the party-scoped operations below take this gate — finding and creating a person happens
   * before anyone is signed in, which is the whole point of those three.
   */
  /**
   * The currency the storefront sells in.
   *
   * Not defaulted: guessing one would price a list in a currency nobody chose, and the mistake would
   * surface as an unpriced row rather than an error — core simply finds no price for a listing in a
   * currency the catalogue does not carry.
   */
  const currencyCode = (): string => {
    if (!currency) {
      throw new VapError(
        'VAP is not configured for prices — pass `currency` (e.g. "INR") to createVapSdk.',
        'Not Configured',
        undefined,
      );
    }
    return currency;
  };

  const requireParty = (): void => {
    if (!context.partyId) {
      throw new VapError('This needs a signed-in party — use sdk.forContext({ partyId }).', 'No Party', 401);
    }
  };

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
    /**
     * The signed-in party's own details.
     *
     * Sent with no workspace, like the wishlist: a person belongs to the organization, not to one
     * of its outlets, so which site the storefront sells from has no bearing on who they are.
     */
    async profile(): Promise<PartyProfile> {
      requireParty();
      return run(() =>
        client
          .query({ query: PARTY_PROFILE_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).partyProfile as PartyProfile),
      );
    },
    /** Saves a change to those details, and answers the profile as it now stands. */
    async updateProfile(input: PartyProfileInput): Promise<PartyProfile> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: UPDATE_PARTY_PROFILE, variables: { input }, context: wishlistContext })
          .then((r) => requireData(r.data).updatePartyProfile as PartyProfile),
      );
    },
    /**
     * The party's address book.
     *
     * Workspace-less like the profile and the wishlist: a person's addresses belong to them, not to
     * the outlet they happen to be shopping at.
     *
     * Every write answers the whole book, because marking one address the default unmarks another.
     */
    async addresses(): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: PARTY_ADDRESSES_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).partyAddresses as PartyAddress[]),
      );
    },
    async addAddress(input: PartyAddressInput): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: ADD_PARTY_ADDRESS, variables: { input }, context: wishlistContext })
          .then((r) => requireData(r.data).addPartyAddress as PartyAddress[]),
      );
    },
    async updateAddress(id: string, input: PartyAddressInput): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: UPDATE_PARTY_ADDRESS,
            variables: { input: { id, ...input } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).updatePartyAddress as PartyAddress[]),
      );
    },
    async removeAddress(id: string): Promise<PartyAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: REMOVE_PARTY_ADDRESS, variables: { input: { id } }, context: wishlistContext })
          .then((r) => requireData(r.data).removePartyAddress as PartyAddress[]),
      );
    },
    async wishlist(): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .query({
            query: WISHLIST_QUERY,
            variables: { input: { currencyCode: currencyCode() } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).wishlist as WishlistItem[]),
      );
    },
    /**
     * Which products are saved — ids only, for a product page's "Saved" state.
     *
     * Sent with no workspace, like every other wishlist call: the list is the person's, org-wide.
     */
    async savedVariantIds(): Promise<string[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: WISHLIST_VARIANT_IDS_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).wishlistVariantIds as string[]),
      );
    },
    /**
     * Marks a listing.
     *
     * Never fails on a repeat: `alreadyExists` reports it instead, so a caller can tell somebody it
     * was already saved rather than claiming a save that did nothing.
     */
    async addToWishlist(offeringVariantId: string): Promise<WishlistAddResult> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: ADD_TO_WISHLIST,
            variables: { input: { offeringVariantId, currencyCode: currencyCode() } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).addToWishlist as WishlistAddResult),
      );
    },
    async removeFromWishlist(offeringVariantId: string): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: REMOVE_FROM_WISHLIST,
            variables: { input: { offeringVariantId, currencyCode: currencyCode() } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).removeFromWishlist as WishlistItem[]),
      );
    },
  };
}

export type PeopleOperations = ReturnType<typeof createPeopleOperations>;
