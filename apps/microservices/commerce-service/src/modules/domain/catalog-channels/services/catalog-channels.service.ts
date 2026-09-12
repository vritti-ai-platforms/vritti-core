import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CatalogChannelType, CatalogChannelTypeValues, catalogChannels, offeringVariants } from '@/db/schema';
import {
  CatalogChannelDto,
  type CatalogChannelRow,
  ChannelItemDto,
  ChannelOverviewDto,
  ChannelResolutionDto,
  ResolvedCatalogDto,
} from '../dto/entity/catalog-channel.dto';
import type { CreateCatalogChannelDto, ResolveCatalogChannelDto } from '../dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainRepository } from '../repositories/catalog-channels.repository';

@Injectable()
export class CatalogChannelsDomainService {
  private readonly logger = new Logger(CatalogChannelsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    catalogId: { column: catalogChannels.catalogId, type: 'string' },
    appId: { column: catalogChannels.appId, type: 'string' },
  };

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    sku: { column: offeringVariants.sku, type: 'string' },
    variantName: { column: offeringVariants.name, type: 'string' },
  };

  constructor(private readonly repository: CatalogChannelsDomainRepository) {}

  // Returns paginated channels of one type for the data table
  async findForTable(
    type: CatalogChannelType,
    state: TableViewState,
  ): Promise<{ result: CatalogChannelDto[]; count: number }> {
    const where = and(
      eq(catalogChannels.type, type),
      FilterProcessor.buildWhere(state.filters, CatalogChannelsDomainService.FIELD_MAP),
      FilterProcessor.buildSearch(state.search, CatalogChannelsDomainService.FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CatalogChannelsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(catalogChannels.appId), asc(catalogChannels.createdAt)],
      limit,
      offset,
    });
    return { result: result.map((row) => CatalogChannelDto.from(row)), count };
  }

  // Returns paginated items of one channel, each flagged with whether that channel sells it
  async findItemsForTable(
    channelId: string,
    state: TableViewState,
  ): Promise<{ result: ChannelItemDto[]; count: number }> {
    const channel = await this.requireChannel(channelId);
    const where = and(
      FilterProcessor.buildWhere(state.filters, CatalogChannelsDomainService.ITEM_FIELD_MAP),
      FilterProcessor.buildSearch(state.search, CatalogChannelsDomainService.ITEM_FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CatalogChannelsDomainService.ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForChannel(channel.catalogId, channelId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(offeringVariants.sku)],
      limit,
      offset,
    });
    return { result: result.map((row) => ChannelItemDto.from(row)), count };
  }

  // Returns one entry per channel type, including the types nothing is assigned to yet
  async overview(): Promise<ChannelOverviewDto[]> {
    const rows = await this.repository.findWildcards();

    return Object.values(CatalogChannelTypeValues).map((type) => {
      const candidates = rows.filter((row) => row.type === type);
      const own = candidates.find((row) => row.isOwn);
      const effective = own ?? candidates.sort((a, b) => this.specificity(b) - this.specificity(a))[0];
      return ChannelOverviewDto.from(type, effective);
    });
  }

  async findById(id: string): Promise<CatalogChannelDto> {
    return CatalogChannelDto.from(await this.requireChannel(id));
  }

  async findByCatalog(catalogId: string): Promise<CatalogChannelDto[]> {
    const rows = await this.repository.findByCatalog(catalogId);
    return rows.map((row) => CatalogChannelDto.from(row));
  }

  // Creates a channel for a named app, or the wildcard when appId is absent
  async create(data: CreateCatalogChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    const catalog = await this.repository.findCatalog(data.catalogId);
    if (!catalog) throw new NotFoundException('Catalog not found.');
    await this.assertNotTaken(data);

    const entity = await this.repository.create({
      catalogId: data.catalogId,
      type: data.type,
      appId: data.appId ?? null,
    });

    this.logger.log(`Created ${data.type} channel for catalog ${data.catalogId}`);
    return {
      success: true,
      message: `Now selling "${catalog.name}".`,
      data: await this.findById(entity.id),
    };
  }

  // Points a channel at a different catalog
  async update(id: string, catalogId: string): Promise<SuccessResponseDto> {
    await this.requireOwnChannel(id);
    const catalog = await this.repository.findCatalog(catalogId);
    if (!catalog) throw new NotFoundException('Catalog not found.');

    await this.repository.update(id, { catalogId });
    this.logger.log(`Repointed channel ${id} to catalog ${catalogId}`);
    return { success: true, message: `Now selling "${catalog.name}".` };
  }

  // Removes a channel, so its callers fall back to the wildcard or to a wider scope
  async delete(id: string): Promise<SuccessResponseDto> {
    const channel = await this.requireOwnChannel(id);
    await this.repository.delete(id);
    this.logger.log(`Deleted ${channel.type} channel ${id}`);
    return { success: true, message: 'Channel removed.' };
  }

  // Excludes or re-includes one item on one channel
  async setItemVisibility(channelId: string, listingId: string, sellsHere: boolean): Promise<SuccessResponseDto> {
    const channel = await this.requireOwnChannel(channelId);
    const listing = await this.repository.findListingInCatalog(listingId, channel.catalogId);
    if (!listing) throw new NotFoundException('That item is not in this channel’s catalog.');

    if (sellsHere) {
      await this.repository.removeExclusion(listingId, channelId);
    } else {
      await this.repository.addExclusion(listingId, channelId);
    }
    return {
      success: true,
      message: sellsHere ? 'Item now sells on this channel.' : 'Item excluded from this channel.',
    };
  }

  // The caller's type comes from the API surface it authenticated against, never from the request.
  // Most specific wins: a named app or till beats a wildcard, a site beats an LE, an LE beats the org.
  async resolve(data: ResolveCatalogChannelDto): Promise<ResolvedCatalogDto> {
    const resolution = await this.tryResolve(data);
    if (!resolution.catalog) {
      throw new NotFoundException({
        label: 'No Catalog For This Channel',
        detail: `No catalog is configured for ${data.type} at this scope. Assign one.`,
      });
    }
    return resolution.catalog;
  }

  // The diagnostic form: an operator asking about an unconfigured channel gets an answer, not an error
  async tryResolve(data: ResolveCatalogChannelDto): Promise<ChannelResolutionDto> {
    const candidates = await this.repository.findCandidates(data);
    const best = candidates.sort((a, b) => this.specificity(b) - this.specificity(a))[0];
    return ChannelResolutionDto.from(best);
  }

  // Rejects a second wildcard on the same type before the unique index has to
  private async assertNotTaken(data: CreateCatalogChannelDto): Promise<void> {
    if (data.appId) return;
    const existing = await this.repository.findOwnWildcard(data.type);
    if (existing) {
      throw new ConflictException({
        label: 'Already Assigned',
        detail: `${data.type} already sells a catalog at this scope. Change the existing one instead.`,
      });
    }
  }

  private async requireChannel(id: string): Promise<CatalogChannelRow> {
    const channel = await this.repository.findByIdWithMeta(id);
    if (!channel) throw new NotFoundException('Channel not found.');
    return channel;
  }

  // Inherited channels are read-only: the row belongs to a wider scope, and everything below it would move
  private async requireOwnChannel(id: string): Promise<CatalogChannelRow> {
    const channel = await this.requireChannel(id);
    if (!channel.isOwn) {
      throw new ConflictException({
        label: 'Inherited Channel',
        detail: 'This channel is set by a wider scope. Change it where it was set.',
      });
    }
    return channel;
  }

  // A named target outranks its scope, because "this till" is a deliberate exception to "any till here"
  private specificity(row: CatalogChannelRow): number {
    return (row.terminalId ? 8 : 0) + (row.appId ? 8 : 0) + (row.siteId ? 4 : 0) + (row.legalEntityId ? 2 : 0);
  }
}
