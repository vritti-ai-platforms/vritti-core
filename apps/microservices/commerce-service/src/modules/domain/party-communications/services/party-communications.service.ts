import type { PartyFunctionAssignmentInput } from '@domain/party-functions/dto/request/party-function-assignment-input.dto';
import { PartyFunctionsDomainService } from '@domain/party-functions/services/party-functions.service';
import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import {
  CONTACTABLE_CHANNELS,
  type PartyCommunication,
  type PartyCommunicationChannel,
  PartyCommunicationChannelValues,
  type PartyFunctionType,
  PartyFunctionTypeValues,
  partyCommunications,
} from '@/db/schema';
import { PartyCommunicationDto, type PartyCommunicationFunction } from '../dto/entity/party-communication.dto';
import type { PartyCommunicationInputDto } from '../dto/request/party-communication-input.dto';
import type { UpdateCommunicationDto } from '../dto/request/update-communication.dto';
import { PartyCommunicationsDomainRepository } from '../repositories/party-communications.repository';

// Rejects function assignments a communication cannot hold: only ORDERING, and only on an email or phone
function assertFunctionsAllowed(channel: PartyCommunicationChannel, functions?: PartyFunctionAssignmentInput[]): void {
  if (!functions?.length) return;
  const invalid = functions.find((assignment) => assignment.function !== PartyFunctionTypeValues.ORDERING);
  if (invalid) {
    throw new BadRequestException({
      label: 'Invalid Function',
      detail: `"${invalid.function}" cannot be assigned to a communication. Only ORDERING is allowed.`,
      errors: [{ field: 'functions', message: 'Only ordering is allowed' }],
    });
  }
  if (!CONTACTABLE_CHANNELS.includes(channel as (typeof CONTACTABLE_CHANNELS)[number])) {
    throw new BadRequestException({
      label: 'Invalid Function',
      detail: 'Only an email address or phone number can be marked for ordering.',
      errors: [{ field: 'functions', message: 'Email or phone only' }],
    });
  }
}

@Injectable()
export class PartyCommunicationsDomainService {
  private readonly logger = new Logger(PartyCommunicationsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    channel: { column: partyCommunications.channel, type: 'string' },
    value: { column: partyCommunications.value, type: 'string' },
    isPrimary: { column: partyCommunications.isPrimary, type: 'boolean' },
    isActive: { column: partyCommunications.isActive, type: 'boolean' },
  };

  // Search runs ILIKE, which Postgres enums (channel) don't support — so it only covers the text columns
  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    value: PartyCommunicationsDomainService.FIELD_MAP.value,
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartyCommunicationsDomainRepository,
    private readonly functionsService: PartyFunctionsDomainService,
  ) {}

  // Resolves the parties reachable at a presented email or phone, oldest party first
  async findPartyIdsByValue(channel: PartyCommunicationChannel, value: string): Promise<string[]> {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return [];

    const partyIds = await this.repository.findPartyIdsByValue(channel, normalized);
    this.logger.log(`communications.findByValue — ${channel} matched ${partyIds.length} parties`);
    return partyIds;
  }

  // Returns paginated communications of a party for the data table
  async findForTable(partyId: string, state: TableState): Promise<{ result: PartyCommunicationDto[]; count: number }> {
    const fieldMap = PartyCommunicationsDomainService.FIELD_MAP;
    const { limit = 20, offset = 0 } = state.pagination;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, fieldMap);
    const { result, count } = await this.repository.findForTable({
      where: and(
        eq(partyCommunications.partyId, partyId),
        FilterProcessor.buildWhere(state.filters, fieldMap),
        FilterProcessor.buildSearch(state.search, PartyCommunicationsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy:
        orderBy.length > 0
          ? orderBy
          : [asc(partyCommunications.channel), desc(partyCommunications.isPrimary), asc(partyCommunications.value)],
      limit,
      offset,
    });
    return { result: result.map((row) => PartyCommunicationDto.from(row, row.apps, row.functions)), count };
  }

  // Returns a party's active communications on one channel as select options, optionally only holders of a function
  findForSelect(
    query: SelectOptionsQueryDto,
    partyId: string,
    channel: PartyCommunicationChannel,
    functionCode?: PartyFunctionType,
  ): Promise<SelectQueryResult> {
    return this.repository.findOptionsForSelect(partyId, channel, query, functionCode);
  }

  // Returns all communications of a party
  async findByParty(partyId: string): Promise<PartyCommunicationDto[]> {
    const rows = await this.repository.findByParty(partyId);
    return rows.map((row) => PartyCommunicationDto.from(row));
  }

  // Returns the party's primary communication for a channel, if one is set
  findPrimary(partyId: string, channel: PartyCommunicationChannel): Promise<PartyCommunication | undefined> {
    return this.repository.findPrimary(partyId, channel);
  }

  // Sets the party's primary value for a channel; an empty value clears it. Runs in the caller's transaction.
  async upsertPrimary(partyId: string, channel: PartyCommunicationChannel, value?: string | null): Promise<void> {
    const trimmed = value?.trim() || null;
    const existing = await this.repository.findPrimary(partyId, channel);

    if (!trimmed) {
      if (existing) await this.repository.delete(existing.id);
      return;
    }

    if (existing) {
      if (existing.value !== trimmed) await this.repository.update(existing.id, { value: trimmed });
      return;
    }

    await this.repository.create({ partyId, channel, value: trimmed, isPrimary: true });
  }

  // Creates a communication for a party, clearing any existing primary of the same channel when this one is primary
  async create(partyId: string, data: PartyCommunicationInputDto): Promise<CreateResponseDto<PartyCommunicationDto>> {
    const partyExists = await this.repository.partyExists(partyId);
    if (!partyExists) throw new NotFoundException('Party not found.');

    const existing = await this.repository.findByPartyChannelValue(partyId, data.channel, data.value);
    if (existing) {
      throw new ConflictException({
        label: 'Communication Exists',
        detail: 'This value is already on record for this channel.',
      });
    }

    const isActive = data.isActive ?? true;
    if (data.isPrimary && !isActive) {
      throw new ConflictException({
        label: 'Invalid State',
        detail: 'A primary value must be active — an inactive value cannot be the primary for its channel.',
      });
    }

    if (data.apps?.length && data.channel !== PartyCommunicationChannelValues.PHONE) {
      throw new ConflictException({
        label: 'Invalid Channel',
        detail: 'Messaging apps can only be added to a phone number.',
      });
    }
    assertFunctionsAllowed(data.channel, data.functions);

    const entity = await this.database.runInTransaction(async () => {
      const isPrimary = data.isPrimary ?? (await this.claimsEmptyPrimarySlot(partyId, data.channel, isActive));
      if (isPrimary) {
        await this.repository.clearPrimaryForChannel(partyId, data.channel);
      }
      const created = await this.repository.create({
        partyId,
        channel: data.channel,
        value: data.value,
        isPrimary,
        isActive,
      });
      if (data.apps) await this.repository.replaceApps(created.id, data.apps);
      if (data.functions?.length) {
        await this.functionsService.syncEntityFunctions({
          partyId,
          target: { communicationId: created.id },
          functions: data.functions,
        });
      }
      return created;
    });

    const apps = (data.apps ?? []).map((a) => ({ app: a.app, handle: a.handle ?? null }));
    const functions = [...new Set((data.functions ?? []).map((a) => a.function as PartyCommunicationFunction))];
    this.logger.log(`Created ${data.channel} communication for party ${partyId}`);
    return {
      success: true,
      message: 'Communication added successfully.',
      data: PartyCommunicationDto.from(entity, apps, functions),
    };
  }

  // Whether a row that did not ask to be primary should become one anyway
  private async claimsEmptyPrimarySlot(
    partyId: string,
    channel: PartyCommunicationChannel,
    isActive: boolean,
  ): Promise<boolean> {
    // A primary must be reachable and contactable: an inactive row cannot be primary, and the
    // party_communications_primary_channel_chk CHECK rejects a primary WEB_APP outright — one person may hold accounts
    // in several web apps.
    if (!isActive) return false;
    if (!CONTACTABLE_CHANNELS.includes(channel as (typeof CONTACTABLE_CHANNELS)[number])) return false;

    const existing = await this.repository.findPrimary(partyId, channel);
    return !existing;
  }

  // Updates a communication, enforcing at most one primary per party+channel via clear-then-set
  async update(id: string, data: Omit<UpdateCommunicationDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Communication not found.');

    if (data.value !== undefined && data.value !== existing.value) {
      const duplicate = await this.repository.findByPartyChannelValue(existing.partyId, existing.channel, data.value);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException({
          label: 'Communication Exists',
          detail: 'This value is already on record for this channel.',
        });
      }
    }

    // A primary value must stay active — blocks retiring the current primary or promoting an inactive value
    const nextPrimary = data.isPrimary ?? existing.isPrimary;
    const nextActive = data.isActive ?? existing.isActive;
    if (nextPrimary && !nextActive) {
      throw new ConflictException({
        label: 'Primary In Use',
        detail: 'The primary value must stay active. Set another value as primary before retiring this one.',
      });
    }

    if (data.apps?.length && existing.channel !== PartyCommunicationChannelValues.PHONE) {
      throw new ConflictException({
        label: 'Invalid Channel',
        detail: 'Messaging apps can only be added to a phone number.',
      });
    }
    assertFunctionsAllowed(existing.channel, data.functions);

    const { apps, functions, ...rest } = data;
    const dropsOrdering =
      functions !== undefined && !functions.some((a) => a.function === PartyFunctionTypeValues.ORDERING);
    const deactivates = rest.isActive === false && existing.isActive;
    if ((dropsOrdering || deactivates) && (await this.repository.isUsedBySupplierEnrollment(id))) {
      throw new ConflictException({
        label: 'Communication In Use',
        detail: 'A supplier site orders through this value. Pick another order email or phone on that site first.',
        errors: [{ field: dropsOrdering ? 'functions' : 'isActive', message: 'Used by a supplier site' }],
      });
    }

    if (Object.keys(rest).length > 0 || apps !== undefined || functions !== undefined) {
      await this.database.runInTransaction(async () => {
        if (rest.isPrimary === true) {
          await this.repository.clearPrimaryForChannel(existing.partyId, existing.channel, id);
        }
        if (Object.keys(rest).length > 0) await this.repository.update(id, rest);
        if (apps !== undefined) await this.repository.replaceApps(id, apps);
        if (functions !== undefined) {
          await this.functionsService.syncEntityFunctions({
            partyId: existing.partyId,
            target: { communicationId: id },
            functions,
          });
        }
      });
    }

    this.logger.log(`Updated communication: ${id}`);
    return { success: true, message: 'Communication updated successfully.' };
  }

  // Deletes a communication by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Communication not found.');
    if (await this.repository.isUsedBySupplierEnrollment(id)) {
      throw new ConflictException({
        label: 'Communication In Use',
        detail: `"${existing.value}" is a supplier site's order contact. Pick another order email or phone on that site first.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted communication: ${id}`);
    return { success: true, message: 'Communication removed successfully.' };
  }
}
