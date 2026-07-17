import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AddCompanyPersonDto } from '../dto/request/add-company-person.dto';
import type { AddPartyAddressDto } from '../dto/request/add-party-address.dto';
import type { AddPartyIdentifierDto } from '../dto/request/add-party-identifier.dto';
import type { CreateCompanyDto } from '../dto/request/create-company.dto';
import type { CreateCompanyRegistrationDto } from '../dto/request/create-company-registration.dto';
import type { UpdateCompanyDto } from '../dto/request/update-company.dto';
import type { UpdateCompanyRegistrationDto } from '../dto/request/update-company-registration.dto';
import type { UpdatePartyAddressDto } from '../dto/request/update-party-address.dto';
import type { CompanyPersonResponseDto } from '../dto/response/company-person-response.dto';
import type { CompanyPersonTableResponseDto } from '../dto/response/company-person-table-response.dto';
import type { CompanyRegistrationResponseDto } from '../dto/response/company-registration-response.dto';
import type { CompanyRegistrationTableResponseDto } from '../dto/response/company-registration-table-response.dto';
import type { CompanyResponseDto } from '../dto/response/company-response.dto';
import type { CompanyTableResponseDto } from '../dto/response/company-table-response.dto';
import type { PartyAddressResponseDto } from '../dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from '../dto/response/party-address-table-response.dto';
import type { PartyIdentifierResponseDto } from '../dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from '../dto/response/party-identifier-table-response.dto';

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
    dto: AddPartyIdentifierDto,
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
  addAddress(companyId: string, dto: AddPartyAddressDto): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`org.companies.addresses.add — companyId: ${companyId}, type: ${dto.type}`);
    return this.nats.send('commerce', 'org.companies.addresses.add', { companyId, ...dto });
  }

  // Updates an address of a company by ID
  updateAddress(addressId: string, dto: UpdatePartyAddressDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.addresses.update — id: ${addressId}`);
    return this.nats.send('commerce', 'org.companies.addresses.update', { id: addressId, ...dto });
  }

  // Removes an address from a company
  removeAddress(addressId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.companies.addresses.remove — id: ${addressId}`);
    return this.nats.send('commerce', 'org.companies.addresses.remove', { id: addressId });
  }
}
