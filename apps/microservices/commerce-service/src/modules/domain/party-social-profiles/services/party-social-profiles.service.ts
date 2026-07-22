import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { partySocialProfiles, SocialPlatformValues } from '@/db/schema';
import { PartySocialProfileDto } from '../dto/entity/party-social-profile.dto';
import type { SocialProfileInputDto } from '../dto/request/social-profile-input.dto';
import type { UpdateSocialProfileDto } from '../dto/request/update-social-profile.dto';
import { PartySocialProfilesDomainRepository } from '../repositories/party-social-profiles.repository';

@Injectable()
export class PartySocialProfilesDomainService {
  private readonly logger = new Logger(PartySocialProfilesDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    platform: { column: partySocialProfiles.platform, type: 'string' },
    url: { column: partySocialProfiles.url, type: 'string' },
  };

  constructor(private readonly repository: PartySocialProfilesDomainRepository) {}

  // Returns paginated social profiles of a party for the data table
  async findForTable(
    partyId: string,
    state: TableViewState,
  ): Promise<{ result: PartySocialProfileDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PartySocialProfilesDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PartySocialProfilesDomainService.FIELD_MAP);
    const where = and(eq(partySocialProfiles.partyId, partyId), filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PartySocialProfilesDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(partySocialProfiles.platform)],
      limit,
      offset,
    });

    return { result: rows.map(PartySocialProfileDto.from), count };
  }

  // Sets the party's WEBSITE profile from the company form; an empty value clears it. Runs in the caller's transaction.
  async upsertWebsite(partyId: string, url?: string | null): Promise<void> {
    const trimmed = url?.trim() || null;
    const existing = await this.repository.findByPartyAndPlatform(partyId, SocialPlatformValues.WEBSITE);

    if (!trimmed) {
      if (existing) await this.repository.delete(existing.id);
      return;
    }

    if (existing) {
      if (existing.url !== trimmed) await this.repository.update(existing.id, { url: trimmed });
      return;
    }

    await this.repository.create({ partyId, platform: SocialPlatformValues.WEBSITE, url: trimmed });
  }

  // Creates a social profile for a party
  async create(partyId: string, data: SocialProfileInputDto): Promise<CreateResponseDto<PartySocialProfileDto>> {
    const partyExists = await this.repository.partyExists(partyId);
    if (!partyExists) throw new NotFoundException('Party not found.');

    const entity = await this.repository.create({ partyId, platform: data.platform, url: data.url });
    this.logger.log(`Created ${data.platform} social profile for party ${partyId}`);
    return {
      success: true,
      message: 'Social profile added successfully.',
      data: PartySocialProfileDto.from(entity),
    };
  }

  // Updates a social profile by ID
  async update(id: string, data: Omit<UpdateSocialProfileDto, 'id'>): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Social profile not found.');
    if (Object.keys(data).length > 0) await this.repository.update(id, data);
    this.logger.log(`Updated social profile: ${id}`);
    return { success: true, message: 'Social profile updated successfully.' };
  }

  // Deletes a social profile by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Social profile not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted social profile: ${id}`);
    return { success: true, message: 'Social profile removed successfully.' };
  }
}
