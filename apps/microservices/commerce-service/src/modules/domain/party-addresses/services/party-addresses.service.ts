import type { PartyFunctionAssignmentInput } from '@domain/party-functions/dto/request/party-function-assignment-input.dto';
import { PartyFunctionsDomainService } from '@domain/party-functions/services/party-functions.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  PrimaryDatabaseService,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { PartyFunctionTypeValues, partyAddresses } from '@/db/schema';
import { PartyAddressDto } from '../dto/entity/party-address.dto';
import { AddPartyAddressDto } from '../dto/request/add-party-address.dto';
import { UpdatePartyAddressDto } from '../dto/request/update-party-address.dto';
import { PartyAddressesDomainRepository } from '../repositories/party-addresses.repository';

// The full set of address functions seeded onto a party's first address
const FIRST_ADDRESS_FUNCTIONS: PartyFunctionAssignmentInput[] = [
  { function: PartyFunctionTypeValues.REGISTERED, isPrimary: true },
  { function: PartyFunctionTypeValues.BILLING, isPrimary: true },
  { function: PartyFunctionTypeValues.SHIPPING, isPrimary: true },
  { function: PartyFunctionTypeValues.ORDERING, isPrimary: true },
];

@Injectable()
export class PartyAddressesDomainService {
  private readonly logger = new Logger(PartyAddressesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    city: { column: partyAddresses.city, type: 'string' },
    countryCode: { column: partyAddresses.countryCode, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartyAddressesDomainRepository,
    private readonly functionsService: PartyFunctionsDomainService,
  ) {}

  // Returns paginated addresses of a party for the data table
  async findForTable(partyId: string, state: TableViewState): Promise<{ result: PartyAddressDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyAddressesDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyAddressesDomainService.FIELD_MAP);
    const where = and(eq(partyAddresses.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyAddressesDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(partyAddresses.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(PartyAddressDto.from), count };
  }

  // Adds an address to a party. The party's first address is seeded with all four address functions;
  // later addresses carry the request's function assignments. Runs in one transaction.
  async add(partyId: string, data: AddPartyAddressDto): Promise<CreateResponseDto<PartyAddressDto>> {
    const { functions, ...address } = data;
    const isFirst = (await this.repository.countByParty(partyId)) === 0;

    const entity = await this.database.runInTransaction(async () => {
      const created = await this.repository.add({
        partyId,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
      });
      const seed = isFirst ? FIRST_ADDRESS_FUNCTIONS : functions;
      if (seed?.length) {
        await this.functionsService.syncEntityFunctions({
          partyId,
          target: { addressId: created.id },
          functions: seed,
        });
      }
      return created;
    });

    this.logger.log(`Added address to party ${partyId}`);
    return { success: true, message: 'Address added successfully.', data: PartyAddressDto.from(entity) };
  }

  // Updates an address and re-syncs its function assignments in the same transaction
  async update(id: string, data: UpdatePartyAddressDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Address not found.');

    const { functions, ...address } = data;
    await this.database.runInTransaction(async () => {
      if (Object.keys(address).length > 0) await this.repository.update(id, address);
      if (functions) {
        await this.functionsService.syncEntityFunctions({
          partyId: existing.partyId,
          target: { addressId: id },
          functions,
        });
      }
    });

    this.logger.log(`Updated address: ${id}`);
    return { success: true, message: 'Address updated successfully.' };
  }

  // Creates or updates a party's primary REGISTERED address (used by company create/edit)
  async upsertPrimary(partyId: string, data: AddPartyAddressDto): Promise<PartyAddressDto> {
    const existing = await this.repository.findPrimaryRegisteredByPartyId(partyId);
    if (existing) {
      const { functions: _functions, ...address } = data;
      await this.update(existing.id, address);
      const updated = await this.repository.findById(existing.id);
      return PartyAddressDto.from(updated as NonNullable<typeof updated>);
    }
    const created = await this.add(partyId, data);
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
