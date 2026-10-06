import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { AppTypeValues } from '@/db/schema';
import { PARTY_FUNCTION_TYPES } from '@/modules/commerce-gateway/_shared/dto/party-function-assignment.dto';
import type { PartyAddressResponseDto } from '@/modules/commerce-gateway/domain/party-addresses/dto/response/party-address-response.dto';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, PartyId, SiteId } from '@/security/decorators';
import { PartyAddress, PartyAddressInput, PartyAddressRefInput, UpdatePartyAddressInput } from './graphql/address.type';
import { Person } from './graphql/person.type';
import { PersonCommunication } from './graphql/person-communication.type';
import {
  AddPersonCommunicationInput,
  CreatePersonInput,
  FindPeopleByCommunicationInput,
  UpdatePartyProfileInput,
} from './graphql/person-mutation.input';
import { WishlistQueryInput, WishlistRefInput } from './graphql/wishlist.input';
import { WishlistAddResult, WishlistItem } from './graphql/wishlist.type';
import { PeopleGatewayService } from './services/people-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_PEOPLE.featureCode)
export class PeopleAppResolver {
  private readonly logger = new Logger(PeopleAppResolver.name);

  constructor(private readonly peopleGatewayService: PeopleGatewayService) {}

  // Who is reachable at this email or phone, oldest party first
  @Query(() => [Person], { name: 'peopleByCommunication' })
  @RequirePermission(ORG_PEOPLE.communications.view)
  async peopleByCommunication(@Args('input') input: FindPeopleByCommunicationInput): Promise<Person[]> {
    this.logger.log('QUERY peopleByCommunication');
    return this.peopleGatewayService.findPeopleByCommunication(input.channel, input.value);
  }

  // The signed-in party's own details
  @Query(() => Person, { name: 'partyProfile' })
  @RequirePermission(ORG_PEOPLE.view)
  partyProfile(@PartyId() partyId: string): Promise<Person> {
    this.logger.log('QUERY partyProfile');
    return this.peopleGatewayService.findById(partyId);
  }

  // The party editing their own details
  @Mutation(() => Person, { name: 'updatePartyProfile' })
  @RequirePermission(ORG_PEOPLE.edit)
  async updatePartyProfile(@PartyId() partyId: string, @Args('input') input: UpdatePartyProfileInput): Promise<Person> {
    this.logger.log('MUTATION updatePartyProfile');
    await this.peopleGatewayService.update(partyId, input);
    return this.peopleGatewayService.findById(partyId);
  }

  // The party's own address book
  @Query(() => [PartyAddress], { name: 'partyAddresses' })
  @RequirePermission(ORG_PEOPLE.addresses.view)
  async partyAddresses(@PartyId() partyId: string): Promise<PartyAddress[]> {
    this.logger.log('QUERY partyAddresses');
    const addresses = await this.peopleGatewayService.listShopperAddresses(partyId);
    return addresses.map(toShopperAddress);
  }

  @Mutation(() => [PartyAddress], { name: 'addPartyAddress' })
  @RequirePermission(ORG_PEOPLE.addresses.add)
  async addPartyAddress(@PartyId() partyId: string, @Args('input') input: PartyAddressInput): Promise<PartyAddress[]> {
    this.logger.log('MUTATION addPartyAddress');
    await this.peopleGatewayService.addPartyAddress(partyId, toAddressPayload(input));
    // The whole book back, not the one row: marking a new address default unmarks another, so a
    // single row would leave the caller redrawing a list it cannot see all of.
    return this.partyAddresses(partyId);
  }

  @Mutation(() => [PartyAddress], { name: 'updatePartyAddress' })
  @RequirePermission(ORG_PEOPLE.addresses.edit)
  async updatePartyAddress(
    @PartyId() partyId: string,
    @Args('input') input: UpdatePartyAddressInput,
  ): Promise<PartyAddress[]> {
    this.logger.log('MUTATION updatePartyAddress');
    const { id, ...address } = input;
    await this.peopleGatewayService.updatePartyAddress(partyId, id, toAddressPayload(address));
    return this.partyAddresses(partyId);
  }

  @Mutation(() => [PartyAddress], { name: 'removePartyAddress' })
  @RequirePermission(ORG_PEOPLE.addresses.delete)
  async removePartyAddress(
    @PartyId() partyId: string,
    @Args('input') input: PartyAddressRefInput,
  ): Promise<PartyAddress[]> {
    this.logger.log('MUTATION removePartyAddress');
    await this.peopleGatewayService.removePartyAddress(partyId, input.id);
    return this.partyAddresses(partyId);
  }

  // Creates the person plus their primary EMAIL and PHONE rows, in one transaction
  @Mutation(() => Person, { name: 'createPerson' })
  @RequirePermission(ORG_PEOPLE.add)
  async createPerson(@Args('input') input: CreatePersonInput): Promise<Person> {
    this.logger.log('MUTATION createPerson');
    const { data } = await this.peopleGatewayService.create({ ...input, isActive: true });
    return data;
  }

  // Adds a communication — the `WEB_APP` reference in the signup flow
  @Mutation(() => PersonCommunication, { name: 'addPersonCommunication' })
  @RequirePermission(ORG_PEOPLE.communications.add)
  async addPersonCommunication(@Args('input') input: AddPersonCommunicationInput): Promise<PersonCommunication> {
    const { personId, ...communication } = input;
    this.logger.log(`MUTATION addPersonCommunication — channel: ${communication.channel}`);
    const { data } = await this.peopleGatewayService.createCommunication(personId, communication);
    return data;
  }

  // ── Wishlist: the things a party marked to come back to ──
  // Both mutations answer with the whole list rather than the row they touched, because the caller is
  // redrawing a row of hearts and a single row would leave it guessing at the rest.

  @Query(() => [WishlistItem], { name: 'wishlist' })
  @RequirePermission(ORG_PEOPLE.wishlist.view)
  wishlist(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: WishlistQueryInput,
  ): Promise<WishlistItem[]> {
    this.logger.log('QUERY wishlist');
    return this.peopleGatewayService.listShopperWishlist(appId, partyId, input.currencyCode, siteId) as Promise<
      WishlistItem[]
    >;
  }

  // Which products the party has saved — a product page draws its Saved state from this
  @Query(() => [ID], { name: 'wishlistVariantIds' })
  @RequirePermission(ORG_PEOPLE.wishlist.view)
  wishlistVariantIds(@AppId() appId: string, @PartyId() partyId: string): Promise<string[]> {
    this.logger.log('QUERY wishlistVariantIds');
    return this.peopleGatewayService.listShopperWishlistVariantIds(appId, partyId);
  }

  // Saving something already saved is the same row, not an error
  @Mutation(() => WishlistAddResult, { name: 'addToWishlist' })
  @RequirePermission(ORG_PEOPLE.wishlist.add)
  addToWishlist(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: WishlistRefInput,
  ): Promise<WishlistAddResult> {
    this.logger.log('MUTATION addToWishlist');
    return this.peopleGatewayService.addToShopperWishlist({
      appId,
      partyId,
      siteId,
      ...input,
    });
  }

  // Unmarking something that was never marked leaves the list in the state asked for
  @Mutation(() => [WishlistItem], { name: 'removeFromWishlist' })
  @RequirePermission(ORG_PEOPLE.wishlist.delete)
  removeFromWishlist(
    @AppId() appId: string,
    @PartyId() partyId: string,
    @SiteId() siteId: string | undefined,
    @Args('input') input: WishlistRefInput,
  ): Promise<WishlistItem[]> {
    this.logger.log('MUTATION removeFromWishlist');
    return this.peopleGatewayService.removeFromShopperWishlist({
      appId,
      partyId,
      siteId,
      ...input,
    }) as Promise<WishlistItem[]>;
  }
}

// Core's address, as a party reads it
function toShopperAddress(address: PartyAddressResponseDto): PartyAddress {
  return {
    id: address.id,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city ?? null,
    region: address.region ?? null,
    postalCode: address.postalCode ?? null,
    countryCode: address.countryCode,
    isDefault: (address.functions ?? []).some(
      (assignment) => assignment.function === PARTY_FUNCTION_TYPES.SHIPPING && assignment.isPrimary,
    ),
  };
}

// A party's address in the shape core's DTOs accept
function toAddressPayload(input: PartyAddressInput) {
  return {
    line1: input.line1,
    line2: input.line2 ?? '',
    city: input.city ?? '',
    region: input.region ?? '',
    postalCode: input.postalCode ?? '',
    countryCode: input.countryCode,
    functions: [{ function: PARTY_FUNCTION_TYPES.SHIPPING, isPrimary: Boolean(input.isDefault) }],
  };
}
