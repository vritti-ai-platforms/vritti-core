import type { CreatePersonDto } from '@commerce/parties/dto/request/create-person.dto';
import type { CreatePersonRegistrationDto } from '@commerce/parties/dto/request/create-person-registration.dto';
import type { UpdatePersonDto } from '@commerce/parties/dto/request/update-person.dto';
import type { UpdatePersonRegistrationDto } from '@commerce/parties/dto/request/update-person-registration.dto';
import type { PersonRegistrationResponseDto } from '@commerce/parties/dto/response/person-registration-response.dto';
import type { PersonRegistrationTableResponseDto } from '@commerce/parties/dto/response/person-registration-table-response.dto';
import type { PersonResponseDto } from '@commerce/parties/dto/response/person-response.dto';
import type { PersonTableResponseDto } from '@commerce/parties/dto/response/person-table-response.dto';
import type { AddPersonAddressDto } from '@commerce/party-addresses/dto/request/add-person-address.dto';
import type { UpdatePersonAddressDto } from '@commerce/party-addresses/dto/request/update-person-address.dto';
import type { PartyAddressResponseDto } from '@commerce/party-addresses/dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from '@commerce/party-addresses/dto/response/party-address-table-response.dto';
import type { CreatePersonBankAccountDto } from '@commerce/party-bank-accounts/dto/request/create-person-bank-account.dto';
import type { UpdatePersonBankAccountDto } from '@commerce/party-bank-accounts/dto/request/update-person-bank-account.dto';
import type { PartyBankAccountResponseDto } from '@commerce/party-bank-accounts/dto/response/party-bank-account-response.dto';
import type { PartyBankAccountTableResponseDto } from '@commerce/party-bank-accounts/dto/response/party-bank-account-table-response.dto';
import type { CreatePersonCommunicationDto } from '@commerce/party-communications/dto/request/create-person-communication.dto';
import type { PartyCommunicationChannelValue } from '@commerce/party-communications/dto/request/party-communication-app.dto';
import type { UpdatePersonCommunicationDto } from '@commerce/party-communications/dto/request/update-person-communication.dto';
import type { PartyCommunicationResponseDto } from '@commerce/party-communications/dto/response/party-communication-response.dto';
import type { PartyCommunicationTableResponseDto } from '@commerce/party-communications/dto/response/party-communication-table-response.dto';
import type { AddPersonIdentifierDto } from '@commerce/party-identifiers/dto/request/add-person-identifier.dto';
import type { PartyIdentifierResponseDto } from '@commerce/party-identifiers/dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from '@commerce/party-identifiers/dto/response/party-identifier-table-response.dto';
import type { CreatePersonLicenseDto } from '@commerce/party-licenses/dto/request/create-person-license.dto';
import type { UpdatePersonLicenseDto } from '@commerce/party-licenses/dto/request/update-person-license.dto';
import type { PartyLicenseResponseDto } from '@commerce/party-licenses/dto/response/party-license-response.dto';
import type { PartyLicenseTableResponseDto } from '@commerce/party-licenses/dto/response/party-license-table-response.dto';
import type { PersonCompanyResponseDto } from '@commerce/party-relationships/dto/response/person-company-response.dto';
import type { PersonCompanyTableResponseDto } from '@commerce/party-relationships/dto/response/person-company-table-response.dto';
import type { CreatePersonSocialProfileDto } from '@commerce/party-social-profiles/dto/request/create-person-social-profile.dto';
import type { UpdatePersonSocialProfileDto } from '@commerce/party-social-profiles/dto/request/update-person-social-profile.dto';
import type { PartySocialProfileResponseDto } from '@commerce/party-social-profiles/dto/response/party-social-profile-response.dto';
import type { PartySocialProfileTableResponseDto } from '@commerce/party-social-profiles/dto/response/party-social-profile-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

export interface StaffShopperRow {
  id: string;
  appId: string;
  catalogListingId: string | null;
  name: string;
  sku: string | null;
  isAvailable: boolean;
}

export interface StaffCartRow extends StaffShopperRow {
  cartId: string;
  siteId: string | null;
  legalEntityId: string | null;
  quantity: number;
  unitPrice: { currency: string; value: string } | null;
  lineTotal: { currency: string; value: string } | null;
}

export interface StaffWishlistItemRow extends StaffShopperRow {
  price: { currency: string; value: string } | null;
  createdAt: string;
}

export interface WishlistItemPayload {
  id: string;
  catalogListingId: string | null;
  offeringVariantId: string;
  name: string;
  sku: string | null;
  price: { currency: string; value: string } | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface WishlistAddPayload {
  alreadyExists: boolean;
  wishlist: WishlistItemPayload[];
}

@Injectable()
export class PeopleGatewayService {
  private readonly logger = new Logger(PeopleGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted people for the data table
  async findForTable(userId: string): Promise<PersonTableResponseDto> {
    this.logger.log('org.people.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-org-people');

    const { result, count } = await this.nats.send<{ result: PersonResponseDto[]; count: number }>(
      'commerce',
      'org.people.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Resolves the people reachable at an email or phone, oldest party first
  findPartiesByCommunication(channel: PartyCommunicationChannelValue, value: string): Promise<string[]> {
    this.logger.log(`org.people.communications.findByValue — channel: ${channel}`);
    return this.nats.send('commerce', 'org.people.communications.findByValue', { channel, value });
  }

  // The same lookup, resolved to whole people
  async findPeopleByCommunication(
    channel: PartyCommunicationChannelValue,
    value: string,
  ): Promise<PersonResponseDto[]> {
    const ids = await this.findPartiesByCommunication(channel, value);
    return Promise.all(ids.map((id) => this.findById(id)));
  }

  // Creates a new person
  create(dto: CreatePersonDto): Promise<CreateResponseDto<PersonResponseDto>> {
    this.logger.log(`org.people.create — firstName: ${dto.firstName}`);
    return this.nats.send('commerce', 'org.people.create', dto);
  }

  // Finds a person by ID
  findById(id: string): Promise<PersonResponseDto> {
    this.logger.log(`org.people.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.people.findById', { id });
  }

  // Updates a person by ID
  update(id: string, dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.update — id: ${id}`);
    return this.nats.send('commerce', 'org.people.update', { id, ...dto });
  }

  // Deletes a person by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.people.delete', { id });
  }

  // A person's saved items. Read only — see the microservice controller for why
  listWishlist(partyId: string, currencyCode: string): Promise<StaffWishlistItemRow[]> {
    this.logger.log(`org.people.wishlist.list — partyId: ${partyId}`);
    return this.nats.send('commerce', 'org.people.wishlist.list', { partyId, currencyCode });
  }

  // Returns the identifiers of a person for the data table
  async listIdentifiers(personId: string, userId: string): Promise<PartyIdentifierTableResponseDto> {
    this.logger.log(`org.people.identifiers.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-identifiers`,
    );

    const { result, count } = await this.nats.send<{ result: PartyIdentifierResponseDto[]; count: number }>(
      'commerce',
      'org.people.identifiers.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns the companies a person is linked to for the data table
  async findCompaniesForTable(personId: string, userId: string): Promise<PersonCompanyTableResponseDto> {
    this.logger.log(`org.people.companies.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-companies`,
    );

    const { result, count } = await this.nats.send<{ result: PersonCompanyResponseDto[]; count: number }>(
      'commerce',
      'org.people.companies.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds an identifier to a person
  addIdentifier(personId: string, dto: AddPersonIdentifierDto): Promise<CreateResponseDto<PartyIdentifierResponseDto>> {
    this.logger.log(`org.people.identifiers.add — personId: ${personId}, idType: ${dto.idType}`);
    return this.nats.send('commerce', 'org.people.identifiers.add', { personId, ...dto });
  }

  // Removes an identifier from a person
  removeIdentifier(identifierId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.identifiers.remove — id: ${identifierId}`);
    return this.nats.send('commerce', 'org.people.identifiers.remove', { id: identifierId });
  }

  // Returns the addresses of a person for the data table
  async listAddresses(personId: string, userId: string): Promise<PartyAddressTableResponseDto> {
    this.logger.log(`org.people.addresses.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-addresses`,
    );

    const { result, count } = await this.nats.send<{ result: PartyAddressResponseDto[]; count: number }>(
      'commerce',
      'org.people.addresses.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds an address to a person
  addAddress(personId: string, dto: AddPersonAddressDto): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`org.people.addresses.add — personId: ${personId}`);
    return this.nats.send('commerce', 'org.people.addresses.add', { personId, ...dto });
  }

  // Updates an address of a person by ID
  updateAddress(addressId: string, dto: UpdatePersonAddressDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.addresses.update — id: ${addressId}`);
    return this.nats.send('commerce', 'org.people.addresses.update', { id: addressId, ...dto });
  }

  // Removes an address from a person
  removeAddress(addressId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.addresses.remove — id: ${addressId}`);
    return this.nats.send('commerce', 'org.people.addresses.remove', { id: addressId });
  }

  // ── The party's own address book, for a storefront acting for one signed-in party ──
  //
  // Every method takes `partyId` from the caller's signature, and it is not optional on any of
  // them. `addPartyAddress` is safe by shape — the party is what the row is created under. The
  // other two name an **address id**, which is attacker-controlled input, so each one proves the
  // address belongs to that party before forwarding. `assertOwned` is the single place that check
  // lives: every app-surface write goes through it, so there is one line to read to know the rule
  // and one place to change it.

  // Every address the party holds
  listShopperAddresses(partyId: string): Promise<PartyAddressResponseDto[]> {
    this.logger.log(`org.people.addresses.list — party: ${partyId}`);
    return this.nats.send('commerce', 'org.people.addresses.list', { personId: partyId });
  }

  // Adds one. Scoped by construction — the party is what it is created under
  addPartyAddress(
    partyId: string,
    dto: Omit<AddPersonAddressDto, 'personId'>,
  ): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`org.people.addresses.add — party: ${partyId}`);
    return this.nats.send('commerce', 'org.people.addresses.add', { personId: partyId, ...dto });
  }

  // Edits one of theirs
  async updatePartyAddress(
    partyId: string,
    addressId: string,
    dto: Omit<UpdatePersonAddressDto, 'id'>,
  ): Promise<SuccessResponseDto> {
    await this.assertOwned(partyId, addressId);
    this.logger.log(`org.people.addresses.update — party: ${partyId}, id: ${addressId}`);
    return this.nats.send('commerce', 'org.people.addresses.update', { id: addressId, ...dto });
  }

  // Removes one of theirs
  async removePartyAddress(partyId: string, addressId: string): Promise<SuccessResponseDto> {
    await this.assertOwned(partyId, addressId);
    this.logger.log(`org.people.addresses.remove — party: ${partyId}, id: ${addressId}`);
    return this.nats.send('commerce', 'org.people.addresses.remove', { id: addressId });
  }

  // Refuses an address that is not this party's
  private async assertOwned(partyId: string, addressId: string): Promise<void> {
    const addresses = await this.listShopperAddresses(partyId);
    if (!addresses.some((address) => address.id === addressId)) {
      throw new NotFoundException({ label: 'Address Not Found', detail: 'That address does not exist.' });
    }
  }

  // Returns the tax registrations of a person for the data table
  async listRegistrations(personId: string, userId: string): Promise<PersonRegistrationTableResponseDto> {
    this.logger.log(`org.people.registrations.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-registrations`,
    );

    const { result, count } = await this.nats.send<{ result: PersonRegistrationResponseDto[]; count: number }>(
      'commerce',
      'org.people.registrations.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a tax registration for a person
  createRegistration(
    personId: string,
    dto: CreatePersonRegistrationDto,
  ): Promise<CreateResponseDto<PersonRegistrationResponseDto>> {
    this.logger.log(`org.people.registrations.create — personId: ${personId}`);
    return this.nats.send('commerce', 'org.people.registrations.create', { personId, ...dto });
  }

  // Updates a person tax registration by ID
  updateRegistration(registrationId: string, dto: UpdatePersonRegistrationDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.registrations.update — id: ${registrationId}`);
    return this.nats.send('commerce', 'org.people.registrations.update', { id: registrationId, ...dto });
  }

  // Deletes a person tax registration by ID
  deleteRegistration(registrationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.registrations.delete — id: ${registrationId}`);
    return this.nats.send('commerce', 'org.people.registrations.delete', { id: registrationId });
  }

  // Returns the licenses of a person for the data table
  async listLicenses(personId: string, userId: string): Promise<PartyLicenseTableResponseDto> {
    this.logger.log(`org.people.licenses.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-licenses`,
    );

    const { result, count } = await this.nats.send<{ result: PartyLicenseResponseDto[]; count: number }>(
      'commerce',
      'org.people.licenses.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a license for a person
  createLicense(personId: string, dto: CreatePersonLicenseDto): Promise<CreateResponseDto<PartyLicenseResponseDto>> {
    this.logger.log(`org.people.licenses.create — personId: ${personId}, licenseType: ${dto.licenseType}`);
    return this.nats.send('commerce', 'org.people.licenses.create', { personId, ...dto });
  }

  // Updates a person license by ID
  updateLicense(licenseId: string, dto: UpdatePersonLicenseDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.licenses.update — id: ${licenseId}`);
    return this.nats.send('commerce', 'org.people.licenses.update', { id: licenseId, ...dto });
  }

  // Deletes a person license by ID
  deleteLicense(licenseId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.licenses.delete — id: ${licenseId}`);
    return this.nats.send('commerce', 'org.people.licenses.delete', { id: licenseId });
  }

  // Returns the bank accounts of a person for the data table
  async listBankAccounts(personId: string, userId: string): Promise<PartyBankAccountTableResponseDto> {
    this.logger.log(`org.people.bankAccounts.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-bank-accounts`,
    );

    const { result, count } = await this.nats.send<{ result: PartyBankAccountResponseDto[]; count: number }>(
      'commerce',
      'org.people.bankAccounts.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a bank account for a person
  createBankAccount(
    personId: string,
    dto: CreatePersonBankAccountDto,
  ): Promise<CreateResponseDto<PartyBankAccountResponseDto>> {
    this.logger.log(`org.people.bankAccounts.create — personId: ${personId}, accountName: ${dto.accountName}`);
    return this.nats.send('commerce', 'org.people.bankAccounts.create', { personId, ...dto });
  }

  // Updates a person bank account by ID
  updateBankAccount(accountId: string, dto: UpdatePersonBankAccountDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.bankAccounts.update — id: ${accountId}`);
    return this.nats.send('commerce', 'org.people.bankAccounts.update', { id: accountId, ...dto });
  }

  // Deletes a person bank account by ID
  deleteBankAccount(accountId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.bankAccounts.delete — id: ${accountId}`);
    return this.nats.send('commerce', 'org.people.bankAccounts.delete', { id: accountId });
  }

  // Returns paginated communications of a person for the data table
  async listCommunications(personId: string, userId: string): Promise<PartyCommunicationTableResponseDto> {
    this.logger.log(`org.people.communications.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-communications`,
    );

    const { result, count } = await this.nats.send<{ result: PartyCommunicationResponseDto[]; count: number }>(
      'commerce',
      'org.people.communications.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a communication for a person
  createCommunication(
    personId: string,
    dto: CreatePersonCommunicationDto,
  ): Promise<CreateResponseDto<PartyCommunicationResponseDto>> {
    this.logger.log(`org.people.communications.create — personId: ${personId}, channel: ${dto.channel}`);
    return this.nats.send('commerce', 'org.people.communications.create', { personId, ...dto });
  }

  // Updates a person communication by ID
  updateCommunication(communicationId: string, dto: UpdatePersonCommunicationDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.communications.update — id: ${communicationId}`);
    return this.nats.send('commerce', 'org.people.communications.update', { id: communicationId, ...dto });
  }

  // Deletes a person communication by ID
  deleteCommunication(communicationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.communications.delete — id: ${communicationId}`);
    return this.nats.send('commerce', 'org.people.communications.delete', { id: communicationId });
  }

  // Returns paginated social profiles of a person for the data table
  async listSocialProfiles(personId: string, userId: string): Promise<PartySocialProfileTableResponseDto> {
    this.logger.log(`org.people.socialProfiles.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-social-profiles`,
    );

    const { result, count } = await this.nats.send<{ result: PartySocialProfileResponseDto[]; count: number }>(
      'commerce',
      'org.people.socialProfiles.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a social profile for a person
  createSocialProfile(
    personId: string,
    dto: CreatePersonSocialProfileDto,
  ): Promise<CreateResponseDto<PartySocialProfileResponseDto>> {
    this.logger.log(`org.people.socialProfiles.create — personId: ${personId}, platform: ${dto.platform}`);
    return this.nats.send('commerce', 'org.people.socialProfiles.create', { personId, ...dto });
  }

  // Updates a person social profile by ID
  updateSocialProfile(profileId: string, dto: UpdatePersonSocialProfileDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.socialProfiles.update — id: ${profileId}`);
    return this.nats.send('commerce', 'org.people.socialProfiles.update', { id: profileId, ...dto });
  }

  // Deletes a person social profile by ID
  deleteSocialProfile(profileId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.socialProfiles.delete — id: ${profileId}`);
    return this.nats.send('commerce', 'org.people.socialProfiles.delete', { id: profileId });
  }

  // ── The party's own wishlist, for a storefront acting for one signed-in party ──

  // Which products the party has saved — ids only, with no catalogue to resolve
  listShopperWishlistVariantIds(appId: string, partyId: string): Promise<string[]> {
    this.logger.log(`org.wishlist.variantIds — party: ${partyId}`);
    return this.nats.send('commerce', 'org.wishlist.variantIds', { appId, partyId });
  }

  async listShopperWishlist(
    appId: string,
    partyId: string,
    currencyCode: string,
    siteId?: string,
  ): Promise<WishlistItemPayload[]> {
    this.logger.log(`org.wishlist.list — party: ${partyId}`);
    // No catalogue resolved here — commerce prices a saved row inside the query that reads it
    return this.nats.send('commerce', 'org.wishlist.list', { appId, partyId, currencyCode, siteId });
  }

  async addToShopperWishlist(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<WishlistAddPayload> {
    this.logger.log(`org.wishlist.add — party: ${input.partyId}, variant: ${input.offeringVariantId}`);

    // Renamed on the way through, deliberately rather than by assertion. The microservice answers
    // `wishlistItems` and the schema field is `wishlist`; `nats.send<T>` only *claims* a shape, so
    // declaring the schema's name here left `wishlist` undefined at runtime and every save failed
    // on a non-nullable list. Translating between the two contracts is this layer's job.
    const result = await this.nats.send<{ alreadyExists: boolean; wishlistItems: WishlistItemPayload[] }>(
      'commerce',
      'org.wishlist.add',
      input,
    );
    return { alreadyExists: result.alreadyExists, wishlist: result.wishlistItems };
  }

  async removeFromShopperWishlist(input: {
    appId: string;
    partyId: string;
    offeringVariantId: string;
    currencyCode: string;
    siteId?: string;
  }): Promise<WishlistItemPayload[]> {
    this.logger.log(`org.wishlist.remove — party: ${input.partyId}, variant: ${input.offeringVariantId}`);
    return this.nats.send('commerce', 'org.wishlist.remove', input);
  }
}
