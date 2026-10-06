import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { CatalogChannelTypeValues, offeringVariants } from '@/db/schema';
import {
  CatalogChannelDto,
  type CatalogChannelRow,
  ChannelCatalogDto,
  ChannelItemDto,
  DEFAULT_SLOT,
  type ResolvedChannelsDto,
} from '../dto/entity/catalog-channel.dto';
import { StorefrontListingDto } from '../dto/entity/storefront-listing.dto';
import type {
  UpsertAppChannelDto,
  UpsertB2bChannelDto,
  UpsertPosChannelDto,
} from '../dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainRepository, type ChannelTarget } from '../repositories/catalog-channels.repository';

@Injectable()
export class CatalogChannelsDomainService {
  private readonly logger = new Logger(CatalogChannelsDomainService.name);

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    sku: { column: offeringVariants.sku, type: 'string' },
    variantName: { column: offeringVariants.name, type: 'string' },
  };

  constructor(private readonly repository: CatalogChannelsDomainRepository) {}

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

  // Which catalog every configured slot resolves to, keyed for lookup
  async list(): Promise<ResolvedChannelsDto> {
    const rows = await this.repository.findResolved();

    return _.chain(rows)
      .groupBy('type')
      .mapValues((ofType) =>
        _.chain(ofType)
          .keyBy((row) => row.appId ?? row.terminalId ?? DEFAULT_SLOT)
          .mapValues((row) => ChannelCatalogDto.from(row))
          .value(),
      )
      .value();
  }

  // Sells a catalog through an app, or through every unnamed caller when appId is absent
  upsertApp(data: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.upsertChannel({
      type: CatalogChannelTypeValues.APP,
      catalogId: data.catalogId,
      appId: data.appId ?? null,
      terminalId: null,
    });
  }

  // Sells a catalog at one terminal, or at every terminal in reach when terminalId is absent
  upsertPos(data: UpsertPosChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.upsertChannel({
      type: CatalogChannelTypeValues.POS,
      catalogId: data.catalogId,
      appId: null,
      terminalId: data.terminalId ?? null,
    });
  }

  // Sells a catalog to wholesale buyers — through one wholesale site, or every unnamed caller
  upsertB2b(data: UpsertB2bChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.upsertChannel({
      type: CatalogChannelTypeValues.B2B,
      catalogId: data.catalogId,
      appId: data.appId ?? null,
      terminalId: null,
    });
  }

  // Removes a channel, so its callers fall back to the wildcard or to a wider scope
  async delete(id: string): Promise<SuccessResponseDto> {
    const channel = await this.requireChannel(id, { owned: true });
    await this.repository.delete(id);
    this.logger.log(`Deleted ${channel.type} channel ${id}`);
    return { success: true, message: 'Channel removed.' };
  }

  // Excludes or re-includes one item on one channel
  async setItemVisibility(channelId: string, listingId: string, sellsHere: boolean): Promise<SuccessResponseDto> {
    const channel = await this.requireChannel(channelId, { owned: true });
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

  // Returns what a storefront sells, through the APP channel its credential resolves to
  async appListings(appId: string): Promise<StorefrontListingDto[]> {
    const channel = await this.repository.resolveCatalogChannel({
      type: CatalogChannelTypeValues.APP,
      appId,
    });
    if (!channel) return [];

    const rows = await this.repository.findListings(channel);
    return rows.map((row) => StorefrontListingDto.from(row));
  }

  // Prices variants the caller already holds, against the same credential's catalog
  async appListingsFromVariants(appId: string, variantIds: string[]): Promise<StorefrontListingDto[]> {
    const channel = await this.repository.resolveCatalogChannel({
      type: CatalogChannelTypeValues.APP,
      appId,
    });
    if (!channel) return [];

    const rows = await this.repository.findListingsByVariants(channel, variantIds);
    return rows.map((row) => StorefrontListingDto.from(row));
  }

  // The one write path behind the three typed entry points
  private async upsertChannel(target: ChannelTarget): Promise<CreateResponseDto<CatalogChannelDto>> {
    const catalog = await this.repository.findCatalog(target.catalogId);
    if (!catalog) throw new NotFoundException('Catalog not found.');
    await this.assertDefaultExists(target);
    await this.assertChangesSomething(target);

    const owned = await this.repository.findOwnChannel(target);
    const entity = owned
      ? await this.repository.update(owned.id, { catalogId: target.catalogId })
      : await this.repository.create({
          catalogId: target.catalogId,
          type: target.type,
          appId: target.appId,
          terminalId: target.terminalId,
        });

    this.logger.log(`${owned ? 'Repointed' : 'Created'} ${target.type} channel ${entity.id}`);
    return {
      success: true,
      message: `Now selling "${catalog.name}".`,
      data: CatalogChannelDto.from(await this.requireChannel(entity.id)),
    };
  }

  // Refuses an assignment that would change nothing
  private async assertChangesSomething(target: ChannelTarget): Promise<void> {
    const current = await this.repository.resolveCatalogChannel({
      type: target.type,
      appId: target.appId,
      terminalId: target.terminalId,
    });
    if (current?.catalogId !== target.catalogId) return;

    const subject = target.appId || target.terminalId ? 'This target' : 'This level';
    throw new ConflictException({
      label: 'Already Using This Catalog',
      detail: `${subject} already sells "${current.catalogName}". Pick a different catalog, or leave it as it is.`,
      errors: [{ field: 'catalogId', message: 'Already in use here' }],
    });
  }

  // A named app or terminal is an exception to a default, so there has to be a default to except
  // from. Without this a workspace could name one app and leave every other caller selling nothing.
  private async assertDefaultExists(target: ChannelTarget): Promise<void> {
    if (!target.appId && !target.terminalId) return;
    if (await this.repository.hasDefaultInReach(target.type)) return;

    const kind = target.appId ? 'app' : 'terminal';
    throw new ConflictException({
      label: 'No Default Yet',
      detail: `${target.type} has no catalog at any level. Add one for every caller first, then give this ${kind} its own.`,
    });
  }

  // Fetch or 404
  private async requireChannel(id: string, options?: { owned: boolean }): Promise<CatalogChannelRow> {
    const channel = await this.repository.findByIdWithMeta(id);
    if (!channel) throw new NotFoundException('Channel not found.');

    if (options?.owned && !channel.isOwn) {
      throw new ConflictException({
        label: 'Inherited Channel',
        detail: 'This channel is set by a wider scope. Change it where it was set.',
      });
    }
    return channel;
  }
}
