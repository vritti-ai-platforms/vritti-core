import type { CreateCompanyDto } from '@commerce/parties/dto/request/create-company.dto';
import type { CreateCompanyRegistrationDto } from '@commerce/parties/dto/request/create-company-registration.dto';
import type { UpdateCompanyDto } from '@commerce/parties/dto/request/update-company.dto';
import type { UpdateCompanyRegistrationDto } from '@commerce/parties/dto/request/update-company-registration.dto';
import type { CompanyRegistrationResponseDto } from '@commerce/parties/dto/response/company-registration-response.dto';
import type { CompanyRegistrationTableResponseDto } from '@commerce/parties/dto/response/company-registration-table-response.dto';
import type { CompanyResponseDto } from '@commerce/parties/dto/response/company-response.dto';
import type { CompanyTableResponseDto } from '@commerce/parties/dto/response/company-table-response.dto';
import type { AddCompanyAddressDto } from '@commerce/party-addresses/dto/request/add-company-address.dto';
import type { UpdateCompanyAddressDto } from '@commerce/party-addresses/dto/request/update-company-address.dto';
import type { PartyAddressResponseDto } from '@commerce/party-addresses/dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from '@commerce/party-addresses/dto/response/party-address-table-response.dto';
import type { CreateCompanyBankAccountDto } from '@commerce/party-bank-accounts/dto/request/create-company-bank-account.dto';
import type { UpdateCompanyBankAccountDto } from '@commerce/party-bank-accounts/dto/request/update-company-bank-account.dto';
import type { PartyBankAccountResponseDto } from '@commerce/party-bank-accounts/dto/response/party-bank-account-response.dto';
import type { PartyBankAccountTableResponseDto } from '@commerce/party-bank-accounts/dto/response/party-bank-account-table-response.dto';
import type { CreateCompanyCommunicationDto } from '@commerce/party-communications/dto/request/create-company-communication.dto';
import type { UpdateCompanyCommunicationDto } from '@commerce/party-communications/dto/request/update-company-communication.dto';
import type { PartyCommunicationResponseDto } from '@commerce/party-communications/dto/response/party-communication-response.dto';
import type { PartyCommunicationTableResponseDto } from '@commerce/party-communications/dto/response/party-communication-table-response.dto';
import type { AddCompanyIdentifierDto } from '@commerce/party-identifiers/dto/request/add-company-identifier.dto';
import type { PartyIdentifierResponseDto } from '@commerce/party-identifiers/dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from '@commerce/party-identifiers/dto/response/party-identifier-table-response.dto';
import type { CreateCompanyLicenseDto } from '@commerce/party-licenses/dto/request/create-company-license.dto';
import type { UpdateCompanyLicenseDto } from '@commerce/party-licenses/dto/request/update-company-license.dto';
import type { PartyLicenseResponseDto } from '@commerce/party-licenses/dto/response/party-license-response.dto';
import type { PartyLicenseTableResponseDto } from '@commerce/party-licenses/dto/response/party-license-table-response.dto';
import type { AddCompanyPersonDto } from '@commerce/party-relationships/dto/request/add-company-person.dto';
import type { UpdateCompanyPersonDto } from '@commerce/party-relationships/dto/request/update-company-person.dto';
import type { CompanyPersonResponseDto } from '@commerce/party-relationships/dto/response/company-person-response.dto';
import type { CompanyPersonTableResponseDto } from '@commerce/party-relationships/dto/response/company-person-table-response.dto';
import type { CreateCompanySocialProfileDto } from '@commerce/party-social-profiles/dto/request/create-company-social-profile.dto';
import type { UpdateCompanySocialProfileDto } from '@commerce/party-social-profiles/dto/request/update-company-social-profile.dto';
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
export class CompaniesGatewayService {
  private readonly logger = new Logger(CompaniesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted companies for the data table
  async findForTable(userId: string): Promise<CompanyTableResponseDto> {
    this.logger.log('org.companies.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-org-companies');

    const { result, count } = await this.nats.send<{ result: CompanyResponseDto[]; count: number }>(
      'commerce',
      'org.companies.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated company options for select dropdowns
  select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.companies');
    return this.nats.send('commerce', 'select.companies', params);
  }

  // Creates a new company
  create(dto: CreateCompanyDto): Promise<CreateResponseDto<CompanyResponseDto>> {
    this.logger.log(`org.companies.create — displayName: ${dto.displayName}`);
    return this.nats.send('commerce', 'org.companies.create', dto);
  }

  // Finds a company by ID
  findById(id: string): Promise<CompanyResponseDto> {
    this.logger.log(`org.companies.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.companies.findById', { id });
  }

  // Updates a company by ID
  update(id: string, dto: UpdateCompanyDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.update — id: ${id}`);
    return this.nats.send('commerce', 'org.companies.update', { id, ...dto });
  }

  // Deletes a company by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.companies.delete', { id });
  }

  // Returns the linked people (person relationships) of a company for the data table
  async listPeople(companyId: string, userId: string): Promise<CompanyPersonTableResponseDto> {
    this.logger.log(`org.companies.people.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-people`,
    );

    const { result, count } = await this.nats.send<{ result: CompanyPersonResponseDto[]; count: number }>(
      'commerce',
      'org.companies.people.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Links a person to a company
  addPerson(companyId: string, dto: AddCompanyPersonDto): Promise<CreateResponseDto<CompanyPersonResponseDto>> {
    this.logger.log(`org.companies.people.add — companyId: ${companyId}, childPartyId: ${dto.childPartyId}`);
    return this.nats.send('commerce', 'org.companies.people.add', { companyId, ...dto });
  }

  // Updates a company-person relationship
  updatePerson(relationshipId: string, dto: UpdateCompanyPersonDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.people.update — id: ${relationshipId}`);
    return this.nats.send('commerce', 'org.companies.people.update', { id: relationshipId, ...dto });
  }

  // Removes a company-person relationship
  removePerson(relationshipId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.people.remove — id: ${relationshipId}`);
    return this.nats.send('commerce', 'org.companies.people.remove', { id: relationshipId });
  }

  // Returns the tax registrations of a company for the data table
  async listRegistrations(companyId: string, userId: string): Promise<CompanyRegistrationTableResponseDto> {
    this.logger.log(`org.companies.registrations.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-registrations`,
    );

    const { result, count } = await this.nats.send<{ result: CompanyRegistrationResponseDto[]; count: number }>(
      'commerce',
      'org.companies.registrations.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a tax registration for a company
  createRegistration(
    companyId: string,
    dto: CreateCompanyRegistrationDto,
  ): Promise<CreateResponseDto<CompanyRegistrationResponseDto>> {
    this.logger.log(`org.companies.registrations.create — companyId: ${companyId}`);
    return this.nats.send('commerce', 'org.companies.registrations.create', { companyId, ...dto });
  }

  // Updates a company tax registration by ID
  updateRegistration(registrationId: string, dto: UpdateCompanyRegistrationDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.registrations.update — id: ${registrationId}`);
    return this.nats.send('commerce', 'org.companies.registrations.update', { id: registrationId, ...dto });
  }

  // Deletes a company tax registration by ID
  deleteRegistration(registrationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.registrations.delete — id: ${registrationId}`);
    return this.nats.send('commerce', 'org.companies.registrations.delete', { id: registrationId });
  }

  // Returns the identifiers of a company for the data table
  async listIdentifiers(companyId: string, userId: string): Promise<PartyIdentifierTableResponseDto> {
    this.logger.log(`org.companies.identifiers.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-identifiers`,
    );

    const { result, count } = await this.nats.send<{ result: PartyIdentifierResponseDto[]; count: number }>(
      'commerce',
      'org.companies.identifiers.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds an identifier to a company
  addIdentifier(
    companyId: string,
    dto: AddCompanyIdentifierDto,
  ): Promise<CreateResponseDto<PartyIdentifierResponseDto>> {
    this.logger.log(`org.companies.identifiers.add — companyId: ${companyId}, idType: ${dto.idType}`);
    return this.nats.send('commerce', 'org.companies.identifiers.add', { companyId, ...dto });
  }

  // Removes an identifier from a company
  removeIdentifier(identifierId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.identifiers.remove — id: ${identifierId}`);
    return this.nats.send('commerce', 'org.companies.identifiers.remove', { id: identifierId });
  }

  // Returns the addresses of a company for the data table
  async listAddresses(companyId: string, userId: string): Promise<PartyAddressTableResponseDto> {
    this.logger.log(`org.companies.addresses.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-addresses`,
    );

    const { result, count } = await this.nats.send<{ result: PartyAddressResponseDto[]; count: number }>(
      'commerce',
      'org.companies.addresses.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds an address to a company
  addAddress(companyId: string, dto: AddCompanyAddressDto): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`org.companies.addresses.add — companyId: ${companyId}`);
    return this.nats.send('commerce', 'org.companies.addresses.add', { companyId, ...dto });
  }

  // Updates an address of a company by ID
  updateAddress(addressId: string, dto: UpdateCompanyAddressDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.addresses.update — id: ${addressId}`);
    return this.nats.send('commerce', 'org.companies.addresses.update', { id: addressId, ...dto });
  }

  // Removes an address from a company
  removeAddress(addressId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.addresses.remove — id: ${addressId}`);
    return this.nats.send('commerce', 'org.companies.addresses.remove', { id: addressId });
  }

  // Returns the licenses of a company for the data table
  async listLicenses(companyId: string, userId: string): Promise<PartyLicenseTableResponseDto> {
    this.logger.log(`org.companies.licenses.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-licenses`,
    );

    const { result, count } = await this.nats.send<{ result: PartyLicenseResponseDto[]; count: number }>(
      'commerce',
      'org.companies.licenses.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a license for a company
  createLicense(companyId: string, dto: CreateCompanyLicenseDto): Promise<CreateResponseDto<PartyLicenseResponseDto>> {
    this.logger.log(`org.companies.licenses.create — companyId: ${companyId}, licenseType: ${dto.licenseType}`);
    return this.nats.send('commerce', 'org.companies.licenses.create', { companyId, ...dto });
  }

  // Updates a license by ID
  updateLicense(licenseId: string, dto: UpdateCompanyLicenseDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.licenses.update — id: ${licenseId}`);
    return this.nats.send('commerce', 'org.companies.licenses.update', { id: licenseId, ...dto });
  }

  // Deletes a license by ID
  deleteLicense(licenseId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.licenses.delete — id: ${licenseId}`);
    return this.nats.send('commerce', 'org.companies.licenses.delete', { id: licenseId });
  }

  // Returns the bank accounts of a company for the data table
  async listBankAccounts(companyId: string, userId: string): Promise<PartyBankAccountTableResponseDto> {
    this.logger.log(`org.companies.bankAccounts.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-bank-accounts`,
    );

    const { result, count } = await this.nats.send<{ result: PartyBankAccountResponseDto[]; count: number }>(
      'commerce',
      'org.companies.bankAccounts.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a bank account for a company
  createBankAccount(
    companyId: string,
    dto: CreateCompanyBankAccountDto,
  ): Promise<CreateResponseDto<PartyBankAccountResponseDto>> {
    this.logger.log(`org.companies.bankAccounts.create — companyId: ${companyId}, accountName: ${dto.accountName}`);
    return this.nats.send('commerce', 'org.companies.bankAccounts.create', { companyId, ...dto });
  }

  // Updates a bank account by ID
  updateBankAccount(accountId: string, dto: UpdateCompanyBankAccountDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.bankAccounts.update — id: ${accountId}`);
    return this.nats.send('commerce', 'org.companies.bankAccounts.update', { id: accountId, ...dto });
  }

  // Deletes a bank account by ID
  deleteBankAccount(accountId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.bankAccounts.delete — id: ${accountId}`);
    return this.nats.send('commerce', 'org.companies.bankAccounts.delete', { id: accountId });
  }

  // Returns paginated communications of a company for the data table
  async listCommunications(companyId: string, userId: string): Promise<PartyCommunicationTableResponseDto> {
    this.logger.log(`org.companies.communications.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-communications`,
    );

    const { result, count } = await this.nats.send<{ result: PartyCommunicationResponseDto[]; count: number }>(
      'commerce',
      'org.companies.communications.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a communication for a company
  createCommunication(
    companyId: string,
    dto: CreateCompanyCommunicationDto,
  ): Promise<CreateResponseDto<PartyCommunicationResponseDto>> {
    this.logger.log(`org.companies.communications.create — companyId: ${companyId}, channel: ${dto.channel}`);
    return this.nats.send('commerce', 'org.companies.communications.create', { companyId, ...dto });
  }

  // Updates a communication by ID
  updateCommunication(communicationId: string, dto: UpdateCompanyCommunicationDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.communications.update — id: ${communicationId}`);
    return this.nats.send('commerce', 'org.companies.communications.update', { id: communicationId, ...dto });
  }

  // Deletes a communication by ID
  deleteCommunication(communicationId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.communications.delete — id: ${communicationId}`);
    return this.nats.send('commerce', 'org.companies.communications.delete', { id: communicationId });
  }

  // Returns paginated social profiles of a company for the data table
  async listSocialProfiles(companyId: string, userId: string): Promise<PartySocialProfileTableResponseDto> {
    this.logger.log(`org.companies.socialProfiles.table — companyId: ${companyId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-company-${companyId}-social-profiles`,
    );

    const { result, count } = await this.nats.send<{ result: PartySocialProfileResponseDto[]; count: number }>(
      'commerce',
      'org.companies.socialProfiles.table',
      { companyId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a social profile for a company
  createSocialProfile(
    companyId: string,
    dto: CreateCompanySocialProfileDto,
  ): Promise<CreateResponseDto<PartySocialProfileResponseDto>> {
    this.logger.log(`org.companies.socialProfiles.create — companyId: ${companyId}, platform: ${dto.platform}`);
    return this.nats.send('commerce', 'org.companies.socialProfiles.create', { companyId, ...dto });
  }

  // Updates a social profile by ID
  updateSocialProfile(profileId: string, dto: UpdateCompanySocialProfileDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.socialProfiles.update — id: ${profileId}`);
    return this.nats.send('commerce', 'org.companies.socialProfiles.update', { id: profileId, ...dto });
  }

  // Deletes a social profile by ID
  deleteSocialProfile(profileId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.socialProfiles.delete — id: ${profileId}`);
    return this.nats.send('commerce', 'org.companies.socialProfiles.delete', { id: profileId });
  }
}
