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
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

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

  // Returns paginated person options for select dropdowns
  select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.people');
    return this.nats.send('commerce', 'select.people', params);
  }

  /**
   * Resolves the people reachable at an email or phone, oldest party first.
   *
   * Returns ids rather than records: one address legitimately sits on several
   * people, and deciding which of them is "the" person is the caller's policy.
   */
  findPartiesByCommunication(channel: PartyCommunicationChannelValue, value: string): Promise<string[]> {
    this.logger.log(`org.people.communications.findByValue — channel: ${channel}`);
    return this.nats.send('commerce', 'org.people.communications.findByValue', { channel, value });
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
}
