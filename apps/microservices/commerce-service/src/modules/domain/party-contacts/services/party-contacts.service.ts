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
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type PartyContactPurpose, partyContacts } from '@/db/schema';
import { PartyContactDto } from '../dto/entity/party-contact.dto';
import type { CreateCompanyContactDto } from '../dto/request/create-company-contact.dto';
import type { UpdateCompanyContactDto } from '../dto/request/update-company-contact.dto';
import { PartyContactsDomainRepository } from '../repositories/party-contacts.repository';

@Injectable()
export class PartyContactsDomainService {
  private readonly logger = new Logger(PartyContactsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    purpose: { column: partyContacts.purpose, type: 'string' },
    label: { column: partyContacts.label, type: 'string' },
    name: { column: partyContacts.name, type: 'string' },
    email: { column: partyContacts.email, type: 'string' },
    phone: { column: partyContacts.phone, type: 'string' },
    isPrimary: { column: partyContacts.isPrimary, type: 'boolean' },
    isActive: { column: partyContacts.isActive, type: 'boolean' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartyContactsDomainRepository,
  ) {}

  // Returns paginated contacts of a party for the data table
  async findForTable(partyId: string, state: TableViewState): Promise<{ result: PartyContactDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyContactsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyContactsDomainService.FIELD_MAP);
    const where = and(eq(partyContacts.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyContactsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(partyContacts.isPrimary), asc(partyContacts.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyContactDto.from), count };
  }

  // Returns paginated active contact options of a party for select dropdowns
  findForSelect(
    query: SelectOptionsQueryDto,
    partyId: string,
    purpose?: PartyContactPurpose,
  ): Promise<SelectQueryResult> {
    return this.repository.findOptionsForSelect(partyId, query, purpose);
  }

  // Creates a contact for a party, clearing any existing primary of the same purpose when this one is primary
  async create(
    partyId: string,
    data: Omit<CreateCompanyContactDto, 'companyId'>,
  ): Promise<CreateResponseDto<PartyContactDto>> {
    const partyExists = await this.repository.partyExists(partyId);
    if (!partyExists) throw new NotFoundException('Party not found.');

    if (!data.email && !data.phone) {
      throw new BadRequestException({
        label: 'Contact Required',
        detail: 'Provide at least an email or a phone number for this contact.',
        errors: [{ field: 'email', message: 'Email or phone required' }],
      });
    }

    const entity = await this.database.runInTransaction(async () => {
      if (data.isPrimary === true) {
        await this.repository.clearPrimaryForPartyPurpose(partyId, data.purpose);
      }
      return this.repository.create({
        partyId,
        purpose: data.purpose,
        label: data.label ?? null,
        name: data.name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        isPrimary: data.isPrimary ?? false,
        isActive: data.isActive ?? true,
      });
    });

    this.logger.log(`Created ${data.purpose} contact for party ${partyId}`);
    return { success: true, message: 'Contact added successfully.', data: PartyContactDto.from(entity) };
  }

  // Updates a contact, enforcing at most one primary per party+purpose via clear-then-set
  async update(id: string, data: Omit<UpdateCompanyContactDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Contact not found.');

    if (Object.keys(data).length > 0) {
      await this.database.runInTransaction(async () => {
        if (data.isPrimary === true) {
          await this.repository.clearPrimaryForPartyPurpose(existing.partyId, existing.purpose, id);
        }
        await this.repository.update(id, data);
      });
    }

    this.logger.log(`Updated contact: ${id}`);
    return { success: true, message: 'Contact updated successfully.' };
  }

  // Deletes a contact by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Contact not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted contact: ${id}`);
    return { success: true, message: 'Contact removed successfully.' };
  }
}
