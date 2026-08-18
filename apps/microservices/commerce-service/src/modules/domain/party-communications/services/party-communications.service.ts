import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  PrimaryDatabaseService,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  CONTACTABLE_CHANNELS,
  type PartyCommunication,
  type PartyCommunicationChannel,
  PartyCommunicationChannelValues,
  partyCommunications,
} from '@/db/schema';
import { PartyCommunicationDto } from '../dto/entity/party-communication.dto';
import type { PartyCommunicationInputDto } from '../dto/request/party-communication-input.dto';
import type { UpdateCommunicationDto } from '../dto/request/update-communication.dto';
import { PartyCommunicationsDomainRepository } from '../repositories/party-communications.repository';

@Injectable()
export class PartyCommunicationsDomainService {
  private readonly logger = new Logger(PartyCommunicationsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    channel: { column: partyCommunications.channel, type: 'string' },
    value: { column: partyCommunications.value, type: 'string' },
    isPrimary: { column: partyCommunications.isPrimary, type: 'boolean' },
    isActive: { column: partyCommunications.isActive, type: 'boolean' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: PartyCommunicationsDomainRepository,
  ) {}

  /**
   * Resolves the parties reachable at a presented email or phone, oldest party first.
   *
   * A list rather than a single party: the table's unique is per party, so one
   * address legitimately sits on several. Which one wins is the caller's policy —
   * this only reports who matched.
   *
   * The value is matched case-insensitively. Callers are still expected to send a
   * normalized value, since only case is handled here.
   */
  async findPartyIdsByValue(channel: PartyCommunicationChannel, value: string): Promise<string[]> {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return [];

    const partyIds = await this.repository.findPartyIdsByValue(channel, normalized);
    this.logger.log(`communications.findByValue — ${channel} matched ${partyIds.length} parties`);
    return partyIds;
  }

  // Returns paginated communications of a party for the data table
  async findForTable(
    partyId: string,
    state: TableViewState,
  ): Promise<{ result: PartyCommunicationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartyCommunicationsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartyCommunicationsDomainService.FIELD_MAP);
    const where = and(eq(partyCommunications.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartyCommunicationsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy:
        orderBy.length > 0
          ? orderBy
          : [asc(partyCommunications.channel), desc(partyCommunications.isPrimary), asc(partyCommunications.value)],
      limit,
      offset,
    });

    return { result: rows.map((row) => PartyCommunicationDto.from(row, row.apps)), count };
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
      return created;
    });

    const apps = (data.apps ?? []).map((a) => ({ app: a.app, handle: a.handle ?? null }));
    this.logger.log(`Created ${data.channel} communication for party ${partyId}`);
    return {
      success: true,
      message: 'Communication added successfully.',
      data: PartyCommunicationDto.from(entity, apps),
    };
  }

  /**
   * Whether a row that did not ask to be primary should become one anyway.
   *
   * True only when the party has nothing primary on that channel yet. A person whose
   * single email is filed as non-primary reads as having no email at all —
   * `findByIdWithDetails` returns the primary — so the first one in claims the slot.
   * An existing primary is never re-pointed, and an explicit `isPrimary` is never
   * second-guessed: the caller has already decided.
   *
   * This is what lets an app add a contact detail without being handed `isPrimary`,
   * which it must not have — re-pointing someone's main email is a staff decision.
   *
   * Runs inside the caller's transaction so the read and the insert see one state.
   */
  private async claimsEmptyPrimarySlot(
    partyId: string,
    channel: PartyCommunicationChannel,
    isActive: boolean,
  ): Promise<boolean> {
    // A primary must be reachable and contactable: an inactive row cannot be primary,
    // and the party_communications_primary_channel_chk CHECK rejects a primary WEB_APP
    // outright — one person may hold accounts in several web apps.
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

    const { apps, ...rest } = data;
    if (Object.keys(rest).length > 0 || apps !== undefined) {
      await this.database.runInTransaction(async () => {
        if (rest.isPrimary === true) {
          await this.repository.clearPrimaryForChannel(existing.partyId, existing.channel, id);
        }
        if (Object.keys(rest).length > 0) await this.repository.update(id, rest);
        if (apps !== undefined) await this.repository.replaceApps(id, apps);
      });
    }

    this.logger.log(`Updated communication: ${id}`);
    return { success: true, message: 'Communication updated successfully.' };
  }

  // Deletes a communication by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Communication not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted communication: ${id}`);
    return { success: true, message: 'Communication removed successfully.' };
  }
}
