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
import { partyAddresses } from '@/db/schema';
import { PartyAddressDto } from '../dto/entity/party-address.dto';
import { AddPartyAddressDto } from '../dto/request/add-party-address.dto';
import { UpdatePartyAddressDto } from '../dto/request/update-party-address.dto';
import { PartyAddressesDomainRepository } from '../repositories/party-addresses.repository';

@Injectable()
export class PartyAddressesDomainService {
  private readonly logger = new Logger(PartyAddressesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: partyAddresses.type, type: 'string' },
    city: { column: partyAddresses.city, type: 'string' },
    countryCode: { column: partyAddresses.countryCode, type: 'string' },
    isPrimary: { column: partyAddresses.isPrimary, type: 'boolean' },
  };

  constructor(private readonly repository: PartyAddressesDomainRepository) {}

  // Returns paginated addresses of a party for the data table
  async findForTable(partyId: string, state: TableViewState): Promise<{ result: PartyAddressDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyAddressesDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyAddressesDomainService.FIELD_MAP);
    const where = and(eq(partyAddresses.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyAddressesDomainService.FIELD_MAP);
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
  async add(partyId: string, data: AddPartyAddressDto): Promise<CreateResponseDto<PartyAddressDto>> {
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

    this.logger.log(`Added address to party ${partyId}`);
    return { success: true, message: 'Address added successfully.', data: PartyAddressDto.from(entity) };
  }

  // Updates an address
  async update(id: string, data: UpdatePartyAddressDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Address not found.');

    if (data.isPrimary) await this.repository.clearPrimary(existing.partyId);

    await this.repository.update(id, data);

    this.logger.log(`Updated address: ${id}`);
    return { success: true, message: 'Address updated successfully.' };
  }

  // Creates or updates a party's single primary address (used by company create/edit)
  async upsertPrimary(partyId: string, data: AddPartyAddressDto): Promise<PartyAddressDto> {
    const existing = await this.repository.findPrimaryByPartyId(partyId);
    if (existing) {
      await this.update(existing.id, { ...data, isPrimary: true });
      const updated = await this.repository.findById(existing.id);
      return PartyAddressDto.from(updated as NonNullable<typeof updated>);
    }
    const created = await this.add(partyId, { ...data, isPrimary: true });
    return created.data;
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
