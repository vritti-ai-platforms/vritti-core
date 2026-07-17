import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type PartyAddressType, partyAddresses } from '@/db/schema';
import { PartyAddressDto } from '../dto/entity/party-address.dto';
import { PartyAddressesRepository } from '../repositories/party-addresses.repository';

export interface AddAddressInput {
  type: PartyAddressType;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  isPrimary?: boolean;
}

export interface UpdateAddressInput {
  type?: PartyAddressType;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  isPrimary?: boolean;
}

@Injectable()
export class PartyAddressesService {
  private readonly logger = new Logger(PartyAddressesService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: partyAddresses.type, type: 'string' },
    city: { column: partyAddresses.city, type: 'string' },
    countryCode: { column: partyAddresses.countryCode, type: 'string' },
    isPrimary: { column: partyAddresses.isPrimary, type: 'boolean' },
  };

  constructor(private readonly repository: PartyAddressesRepository) {}

  // Returns paginated addresses of a party for the data table
  async findForTable(partyId: string, state: TableViewState): Promise<{ result: PartyAddressDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyAddressesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyAddressesService.FIELD_MAP);
    const where = and(eq(partyAddresses.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyAddressesService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(partyAddresses.isPrimary), asc(partyAddresses.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyAddressDto.from), count };
  }

  // Adds an address to a party, syncing the party country when it becomes the primary or first address
  async add(partyId: string, data: AddAddressInput): Promise<CreateResponseDto<PartyAddressDto>> {
    const { count: existingCount } = await this.repository.findForTable({
      where: eq(partyAddresses.partyId, partyId),
      limit: 1,
      offset: 0,
    });
    const isFirst = existingCount === 0;

    if (data.isPrimary) await this.repository.clearPrimary(partyId);

    const entity = await this.repository.add({
      partyId,
      type: data.type,
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      region: data.region,
      postalCode: data.postalCode,
      countryCode: data.countryCode,
      isPrimary: data.isPrimary ?? isFirst,
    });

    if (data.isPrimary || isFirst) await this.repository.setPartyCountry(partyId, data.countryCode);

    this.logger.log(`Added address to party ${partyId}`);
    return { success: true, message: 'Address added successfully.', data: PartyAddressDto.from(entity) };
  }

  // Updates an address, re-syncing the party country when the resulting address is primary
  async update(id: string, data: UpdateAddressInput): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Address not found.');

    if (data.isPrimary) await this.repository.clearPrimary(existing.partyId);

    const updated = await this.repository.update(id, data);

    const becamePrimary = data.isPrimary === true;
    const countryChanged = updated.isPrimary && data.countryCode !== undefined && data.countryCode !== existing.countryCode;
    if (becamePrimary || countryChanged) await this.repository.setPartyCountry(updated.partyId, updated.countryCode);

    this.logger.log(`Updated address: ${id}`);
    return { success: true, message: 'Address updated successfully.' };
  }

  // Removes an address by ID
  async remove(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Address not found.');
    await this.repository.remove(id);
    this.logger.log(`Removed address: ${id}`);
    return { success: true, message: 'Address removed successfully.' };
  }
}
