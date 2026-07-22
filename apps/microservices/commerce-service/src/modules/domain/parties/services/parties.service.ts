import { PartyCommunicationsDomainService } from '@domain/party-communications/services/party-communications.service';
import { PartySocialProfilesDomainService } from '@domain/party-social-profiles/services/party-social-profiles.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type Party,
  PartyCommunicationChannelValues,
  type PartyType,
  PartyTypeValues,
  parties,
  partyTaxRegistrations,
} from '@/db/schema';
import { CompanyDto } from '../dto/entity/company.dto';
import { PartyTaxRegistrationDto } from '../dto/entity/party-tax-registration.dto';
import { PersonDto } from '../dto/entity/person.dto';
import type { CreateCompanyRegistrationDto } from '../dto/request/create-company-registration.dto';
import type { UpdateCompanyRegistrationDto } from '../dto/request/update-company-registration.dto';
import { emailComm, PartiesDomainRepository, type PartyTableRow, phoneComm } from '../repositories/parties.repository';

export interface CreatePartyInput {
  partyType: PartyType;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  legalName?: string | null;
  jurisdictionId?: string | null;
  website?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface UpdatePartyInput {
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  legalName?: string | null;
  jurisdictionId?: string | null;
  website?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface CreatedParty {
  party: Party;
  email: string | null;
  phone: string | null;
  website: string | null;
}

@Injectable()
export class PartiesDomainService {
  private readonly logger = new Logger(PartiesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    displayName: { column: parties.displayName, type: 'string' },
    email: { column: emailComm.value, type: 'string' },
    phone: { column: phoneComm.value, type: 'string' },
    isActive: { column: parties.isActive, type: 'boolean' },
  };

  private static readonly REGISTRATION_FIELD_MAP: FieldMap = {
    registrationNumber: { column: partyTaxRegistrations.registrationNumber, type: 'string' },
    registrationType: { column: partyTaxRegistrations.registrationType, type: 'string' },
    isPrimary: { column: partyTaxRegistrations.isPrimary, type: 'boolean' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartiesDomainRepository,
    private readonly communicationsService: PartyCommunicationsDomainService,
    private readonly socialProfilesService: PartySocialProfilesDomainService,
  ) {}

  // Returns paginated COMPANY parties for the companies data table
  async findCompaniesForTable(state: TableViewState): Promise<{ result: CompanyDto[]; count: number }> {
    const { result, count } = await this.queryPartiesForTable(state, PartyTypeValues.COMPANY);
    return { result: result.map((row) => CompanyDto.from(row, { email: row.email, phone: row.phone })), count };
  }

  // Returns paginated PERSON parties for the people data table
  async findPeopleForTable(state: TableViewState): Promise<{ result: PersonDto[]; count: number }> {
    const { result, count } = await this.queryPartiesForTable(state, PartyTypeValues.PERSON);
    return { result: result.map((row) => PersonDto.from(row, { email: row.email, phone: row.phone })), count };
  }

  // Returns paginated party rows of the given type, applying filters, search, sort, and pagination
  private queryPartiesForTable(
    state: TableViewState,
    partyType: PartyType,
  ): Promise<{ result: PartyTableRow[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartiesDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartiesDomainService.FIELD_MAP);
    const where = and(eq(parties.partyType, partyType), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartiesDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    return this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(parties.createdAt)],
      limit,
      offset,
    });
  }

  // Returns paginated party options of the given type for select dropdowns
  findForSelect(query: SelectOptionsQueryDto, partyType: PartyType): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'displayName',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      where: { partyType },
      orderByKey: query.orderByKey || 'displayName',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Returns paginated active tax registration options of a party for select dropdowns
  findRegistrationsForSelect(query: SelectOptionsQueryDto, partyId: string): Promise<SelectQueryResult> {
    return this.repository.findRegistrationOptionsForSelect(partyId, query);
  }

  // Creates a COMPANY party and returns it as a CompanyDto
  async createCompany(data: CreatePartyInput): Promise<CreateResponseDto<CompanyDto>> {
    const { party, email, phone, website } = await this.createParty(data);
    return {
      success: true,
      message: `${party.displayName} created successfully.`,
      data: CompanyDto.from(party, { email, phone, website }),
    };
  }

  // Creates a PERSON party and returns it as a PersonDto
  async createPerson(data: CreatePartyInput): Promise<CreateResponseDto<PersonDto>> {
    const { party, email, phone } = await this.createParty(data);
    return {
      success: true,
      message: `${party.displayName} created successfully.`,
      data: PersonDto.from(party, { email, phone }),
    };
  }

  // Creates a party plus its primary EMAIL/PHONE communications when supplied
  private async createParty(data: CreatePartyInput): Promise<CreatedParty> {
    const displayName = data.displayName || [data.firstName, data.lastName].filter(Boolean).join(' ');
    if (!displayName) {
      throw new ConflictException({
        label: 'Name Required',
        detail: 'A display name (or first/last name) is required.',
      });
    }

    const email = data.email ?? null;
    const phone = data.phone ?? null;
    const website = data.website ?? null;

    const party = await this.database.runInTransaction(async () => {
      const entity = await this.repository.create({
        partyType: data.partyType,
        displayName,
        isActive: data.isActive,
        legalName: data.legalName ?? null,
        jurisdictionId: data.jurisdictionId ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
      });
      await this.communicationsService.upsertPrimary(entity.id, PartyCommunicationChannelValues.EMAIL, email);
      await this.communicationsService.upsertPrimary(entity.id, PartyCommunicationChannelValues.PHONE, phone);
      await this.socialProfilesService.upsertWebsite(entity.id, website);
      return entity;
    });

    this.logger.log(`Created party: ${party.displayName} (${party.partyType})`);
    return { party, email, phone, website };
  }

  // Returns a company by ID with its primary address and main-line contact; a supplier reference blocks deletion
  async findCompanyById(id: string): Promise<CompanyDto> {
    const details = await this.repository.findByIdWithDetails(id);
    if (!details) throw new NotFoundException('Company not found.');
    const canDelete = !details.referencedBySupplier;
    return CompanyDto.from(
      details.party,
      { email: details.email, phone: details.phone, website: details.website },
      details.primaryAddress,
      canDelete,
    );
  }

  // Returns a person by ID with their primary address and main-line contact; supplier/company links block deletion
  async findPersonById(id: string): Promise<PersonDto> {
    const details = await this.repository.findByIdWithDetails(id);
    if (!details) throw new NotFoundException('Person not found.');
    const canDelete = !details.referencedBySupplier && !details.linkedToCompanies;
    return PersonDto.from(
      details.party,
      { email: details.email, phone: details.phone },
      details.primaryAddress,
      canDelete,
    );
  }

  // Updates a party's editable fields, upserting its primary EMAIL/PHONE communications
  async update(id: string, data: UpdatePartyInput): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);

    const { email, phone, website, ...rest } = data;
    const payload: Partial<Party> = { ...rest };

    if (data.displayName === undefined && (data.firstName !== undefined || data.lastName !== undefined)) {
      const firstName = data.firstName !== undefined ? data.firstName : existing.firstName;
      const lastName = data.lastName !== undefined ? data.lastName : existing.lastName;
      const composed = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (composed) payload.displayName = composed;
    }

    await this.database.runInTransaction(async () => {
      if (Object.keys(payload).length > 0) await this.repository.update(id, payload);
      if (email !== undefined) {
        await this.communicationsService.upsertPrimary(id, PartyCommunicationChannelValues.EMAIL, email);
      }
      if (phone !== undefined) {
        await this.communicationsService.upsertPrimary(id, PartyCommunicationChannelValues.PHONE, phone);
      }
      if (website !== undefined) {
        await this.socialProfilesService.upsertWebsite(id, website);
      }
    });

    this.logger.log(`Updated party: ${existing.displayName} (${id})`);
    return { success: true, message: `${data.displayName ?? existing.displayName} updated successfully.` };
  }

  // Deletes a party by ID. Blocked when a supplier references it; a person is also blocked while
  // still linked to companies (so a live contact isn't silently unlinked).
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    if (await this.repository.isReferencedBySupplier(id)) {
      throw new ConflictException({
        label: 'In Use',
        detail: `"${existing.displayName}" is linked to a supplier and cannot be deleted. Remove the supplier record first.`,
      });
    }
    if (existing.partyType === PartyTypeValues.PERSON && (await this.repository.isLinkedToCompany(id))) {
      throw new ConflictException({
        label: 'In Use',
        detail: `"${existing.displayName}" is linked to one or more companies and cannot be deleted. Remove the company links first.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted party: ${existing.displayName} (${id})`);
    return { success: true, message: `${existing.displayName} deleted successfully.` };
  }

  // Returns paginated tax registrations of a party for the data table
  async findRegistrationsForTable(
    partyId: string,
    state: TableViewState,
  ): Promise<{ result: PartyTaxRegistrationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartiesDomainService.REGISTRATION_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartiesDomainService.REGISTRATION_FIELD_MAP);
    const where = and(eq(partyTaxRegistrations.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartiesDomainService.REGISTRATION_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findRegistrationsForTable({
      where,
      orderBy:
        orderBy.length > 0 ? orderBy : [desc(partyTaxRegistrations.isPrimary), asc(partyTaxRegistrations.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map((row) => PartyTaxRegistrationDto.from(row, row.jurisdictionName)), count };
  }

  // Creates a tax registration for a party
  async createRegistration(
    partyId: string,
    data: Omit<CreateCompanyRegistrationDto, 'companyId'>,
  ): Promise<CreateResponseDto<PartyTaxRegistrationDto>> {
    await this.requireById(partyId);

    const isPrimary = data.isPrimary ?? false;
    const isActive = data.isActive ?? true;
    if (isPrimary && !isActive) {
      throw new ConflictException({
        label: 'Invalid State',
        detail: 'A primary registration must be active — an inactive registration cannot be the primary.',
      });
    }

    const entity = await this.repository.createRegistration({
      partyId,
      jurisdictionId: data.jurisdictionId,
      registrationNumber: data.registrationNumber,
      registrationType: data.registrationType,
      isPrimary,
      isActive,
    });

    this.logger.log(`Created tax registration for party ${partyId}`);
    return {
      success: true,
      message: 'Tax registration created successfully.',
      data: PartyTaxRegistrationDto.from(entity),
    };
  }

  // Updates a party tax registration
  async updateRegistration(id: string, data: Omit<UpdateCompanyRegistrationDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findRegistrationById(id);
    if (!existing) throw new NotFoundException('Tax registration not found.');

    const nextPrimary = data.isPrimary ?? existing.isPrimary;
    const nextActive = data.isActive ?? existing.isActive;
    if (nextPrimary && !nextActive) {
      throw new ConflictException({
        label: 'Primary In Use',
        detail:
          'The primary registration must stay active. Set another registration as primary before retiring this one.',
      });
    }

    await this.repository.updateRegistration(id, data);

    this.logger.log(`Updated tax registration: ${id}`);
    return { success: true, message: 'Tax registration updated successfully.' };
  }

  // Deletes a party tax registration
  async deleteRegistration(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findRegistrationById(id);
    if (!existing) throw new NotFoundException('Tax registration not found.');
    await this.repository.deleteRegistration(id);
    this.logger.log(`Deleted tax registration: ${id}`);
    return { success: true, message: 'Tax registration deleted successfully.' };
  }

  // Loads a party by ID, throwing if not found
  private async requireById(id: string, message = 'Party not found.'): Promise<Party> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException(message);
    return entity;
  }
}
