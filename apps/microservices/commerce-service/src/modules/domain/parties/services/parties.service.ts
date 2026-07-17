import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type Party,
  type PartyType,
  parties,
  partyTaxRegistrations,
  type TaxRegistrationType,
} from '@/db/schema';
import { PartyDto } from '../dto/entity/party.dto';
import { PartyTaxRegistrationDto } from '../dto/entity/party-tax-registration.dto';
import { PartiesRepository } from '../repositories/parties.repository';

export interface CreatePartyInput {
  partyType: PartyType;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
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
  address?: string | null;
  isActive?: boolean;
  legalName?: string | null;
  jurisdictionId?: string | null;
  website?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface CreateRegistrationInput {
  jurisdictionId: string;
  registrationNumber: string;
  registrationType: TaxRegistrationType;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateRegistrationInput {
  jurisdictionId?: string;
  registrationNumber?: string;
  registrationType?: TaxRegistrationType;
  isPrimary?: boolean;
  isActive?: boolean;
}

@Injectable()
export class PartiesService {
  private readonly logger = new Logger(PartiesService.name);

  private static readonly FIELD_MAP: FieldMap = {
    displayName: { column: parties.displayName, type: 'string' },
    email: { column: parties.email, type: 'string' },
    phone: { column: parties.phone, type: 'string' },
    isActive: { column: parties.isActive, type: 'boolean' },
  };

  private static readonly REGISTRATION_FIELD_MAP: FieldMap = {
    registrationNumber: { column: partyTaxRegistrations.registrationNumber, type: 'string' },
    registrationType: { column: partyTaxRegistrations.registrationType, type: 'string' },
    isPrimary: { column: partyTaxRegistrations.isPrimary, type: 'boolean' },
  };

  constructor(private readonly repository: PartiesRepository) {}

  // Returns paginated parties of the given type for the data table
  async findForTable(state: TableViewState, partyType: PartyType): Promise<{ result: PartyDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartiesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartiesService.FIELD_MAP);
    const where = and(eq(parties.partyType, partyType), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartiesService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(parties.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyDto.from), count };
  }

  // Returns paginated party options of the given type for select dropdowns
  findForSelect(query: SelectOptionsQueryDto, partyType: PartyType): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'displayName',
      description: query.descriptionKey || 'email',
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

  // Creates a new party, deriving the display name from first/last when absent
  async create(data: CreatePartyInput): Promise<CreateResponseDto<PartyDto>> {
    const displayName = data.displayName || [data.firstName, data.lastName].filter(Boolean).join(' ');
    if (!displayName) {
      throw new ConflictException({
        label: 'Name Required',
        detail: 'A display name (or first/last name) is required.',
      });
    }

    const entity = await this.repository.create({
      partyType: data.partyType,
      displayName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      isActive: data.isActive,
      legalName: data.legalName ?? null,
      jurisdictionId: data.jurisdictionId ?? null,
      website: data.website ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
    });

    this.logger.log(`Created party: ${entity.displayName} (${entity.partyType})`);
    return {
      success: true,
      message: `${entity.displayName} created successfully.`,
      data: PartyDto.from(entity),
    };
  }

  // Returns a single party by ID
  async findById(id: string): Promise<PartyDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Party not found.');
    return PartyDto.from(entity);
  }

  // Updates a party's editable fields
  async update(id: string, data: UpdatePartyInput): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);

    const payload: Partial<Party> = { ...data };

    if (data.displayName === undefined && (data.firstName !== undefined || data.lastName !== undefined)) {
      const firstName = data.firstName !== undefined ? data.firstName : existing.firstName;
      const lastName = data.lastName !== undefined ? data.lastName : existing.lastName;
      const composed = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (composed) payload.displayName = composed;
    }

    if (Object.keys(payload).length > 0) {
      await this.repository.update(id, payload);
    }

    this.logger.log(`Updated party: ${existing.displayName} (${id})`);
    return { success: true, message: `${data.displayName ?? existing.displayName} updated successfully.` };
  }

  // Deletes a party by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.requireById(id);
    await this.repository.delete(id);
    this.logger.log(`Deleted party: ${existing.displayName} (${id})`);
    return { success: true, message: `${existing.displayName} deleted successfully.` };
  }

  // Returns paginated tax registrations of a party for the data table
  async findRegistrationsForTable(
    partyId: string,
    state: TableViewState,
  ): Promise<{ result: PartyTaxRegistrationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartiesService.REGISTRATION_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartiesService.REGISTRATION_FIELD_MAP);
    const where = and(eq(partyTaxRegistrations.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartiesService.REGISTRATION_FIELD_MAP);
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
    data: CreateRegistrationInput,
  ): Promise<CreateResponseDto<PartyTaxRegistrationDto>> {
    await this.requireById(partyId);

    const entity = await this.repository.createRegistration({
      partyId,
      jurisdictionId: data.jurisdictionId,
      registrationNumber: data.registrationNumber,
      registrationType: data.registrationType,
      isPrimary: data.isPrimary ?? false,
      isActive: data.isActive ?? true,
    });

    this.logger.log(`Created tax registration for party ${partyId}`);
    return {
      success: true,
      message: 'Tax registration created successfully.',
      data: PartyTaxRegistrationDto.from(entity),
    };
  }

  // Updates a party tax registration
  async updateRegistration(id: string, data: UpdateRegistrationInput): Promise<SuccessResponseDto> {
    const existing = await this.repository.findRegistrationById(id);
    if (!existing) throw new NotFoundException('Tax registration not found.');

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
