import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { isIdentifierTypeApplicable, partyIdentifiers } from '@/db/schema';
import { PartyIdentifierDto } from '../dto/entity/party-identifier.dto';
import { AddPartyIdentifierDto } from '../dto/request/add-party-identifier.dto';
import { PartyIdentifiersDomainRepository } from '../repositories/party-identifiers.repository';

@Injectable()
export class PartyIdentifiersDomainService {
  private readonly logger = new Logger(PartyIdentifiersDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    idType: { column: partyIdentifiers.idType, type: 'string' },
    idValue: { column: partyIdentifiers.idValue, type: 'string' },
    isPrimary: { column: partyIdentifiers.isPrimary, type: 'boolean' },
    isActive: { column: partyIdentifiers.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: PartyIdentifiersDomainRepository) {}

  // Returns paginated identifiers of a party for the data table
  async findForTable(partyId: string, state: TableViewState): Promise<{ result: PartyIdentifierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyIdentifiersDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyIdentifiersDomainService.FIELD_MAP);
    const where = and(eq(partyIdentifiers.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyIdentifiersDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(partyIdentifiers.isPrimary), asc(partyIdentifiers.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyIdentifierDto.from), count };
  }

  // Adds an identifier to a party, rejecting duplicates of the same type and value
  async add(partyId: string, data: AddPartyIdentifierDto): Promise<CreateResponseDto<PartyIdentifierDto>> {
    const partyType = await this.repository.getPartyType(partyId);
    if (!partyType) throw new NotFoundException('Party not found.');
    if (!isIdentifierTypeApplicable(partyType, data.idType)) {
      throw new BadRequestException({
        label: 'Invalid Identifier',
        detail: `${data.idType} is not a valid identifier type for a ${partyType === 'PERSON' ? 'person' : 'company'}.`,
        errors: [{ field: 'idType', message: 'Not valid for this party' }],
      });
    }

    const existing = await this.repository.findByTypeValue(data.idType, data.idValue);
    if (existing) {
      throw new ConflictException({
        label: 'Identifier exists',
        detail: `This ${data.idType} is already on record.`,
      });
    }

    const entity = await this.repository.add({
      partyId,
      idType: data.idType,
      idValue: data.idValue,
      isPrimary: data.isPrimary ?? false,
    });

    this.logger.log(`Added identifier ${data.idType} to party ${partyId}`);
    return { success: true, message: 'Identifier added successfully.', data: PartyIdentifierDto.from(entity) };
  }

  // Removes an identifier by ID
  async remove(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Identifier not found.');
    await this.repository.remove(id);
    this.logger.log(`Removed identifier: ${id}`);
    return { success: true, message: 'Identifier removed successfully.' };
  }
}
