import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, asc, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { CatalogChannelTypeValues, CatalogFilterModeValues, offeringVariants } from '@/db/schema';
import {
  CatalogChannelDto,
  type CatalogChannelRow,
  ChannelCatalogDto,
  ChannelItemDto,
  ChannelPriceDto,
  DEFAULT_SLOT,
  type ResolvedChannelsDto,
} from '../dto/entity/catalog-channel.dto';
import { ListingFilterDto, ListingFilterKindValues } from '../dto/entity/listing-filter.dto';
import { StorefrontListingDto, type StorefrontListingsDto } from '../dto/entity/storefront-listing.dto';
import { buildVariantAxes, type CatalogListingDetailDto } from '../dto/entity/variant-axis.dto';
import { LISTINGS_PER_PAGE, type ListingQueryDto, ListingSortValues } from '../dto/request/listing-query.dto';
import type {
  UpsertAppChannelDto,
  UpsertB2bChannelDto,
  UpsertPosChannelDto,
} from '../dto/request/upsert-catalog-channel.dto';
import {
  CatalogChannelsDomainRepository,
  type ChannelTarget,
  type ListingFilterSelection,
  type StorefrontChannel,
} from '../repositories/catalog-channels.repository';

@Injectable()
export class CatalogChannelsDomainService {
  private readonly logger = new Logger(CatalogChannelsDomainService.name);

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    code: { column: offeringVariants.code, type: 'string' },
    variantName: { column: offeringVariants.name, type: 'string' },
  };

  constructor(private readonly repository: CatalogChannelsDomainRepository) {}

  // Returns paginated items of one channel, each flagged with whether that channel makes it available
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
      orderBy: orderBy.length > 0 ? orderBy : [asc(offeringVariants.code)],
      limit,
      offset,
    });
    return { result: result.map((row) => ChannelItemDto.from(row)), count };
  }

  // What this channel charges in one currency, and whether it is available there
  async findPricesForTable(
    channelId: string,
    currencyCode: string,
    state: TableViewState,
  ): Promise<{ result: ChannelPriceDto[]; count: number }> {
    const channel = await this.requireChannel(channelId);
    const where = and(
      FilterProcessor.buildWhere(state.filters, CatalogChannelsDomainService.ITEM_FIELD_MAP),
      FilterProcessor.buildSearch(state.search, CatalogChannelsDomainService.ITEM_FIELD_MAP),
    );
    const orderBy = FilterProcessor.buildOrderBy(state.sort, CatalogChannelsDomainService.ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findPricesForChannel(channel.catalogId, channelId, currencyCode, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [asc(offeringVariants.code)],
      limit,
      offset,
    });
    return { result: result.map((row) => ChannelPriceDto.from(row)), count };
  }

  // The currencies this channel's catalog is priced in — the tabs the Prices view offers
  async findCurrencies(channelId: string): Promise<string[]> {
    const channel = await this.requireChannel(channelId);
    return this.repository.findCatalogCurrencies(channel.catalogId);
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

  // Makes a catalog available through an app, or through every unnamed caller when appId is absent
  upsertApp(data: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.upsertChannel({
      type: CatalogChannelTypeValues.APP,
      catalogId: data.catalogId,
      appId: data.appId ?? null,
      terminalId: null,
    });
  }

  // Makes a catalog available at one terminal, or at every terminal in reach when terminalId is absent
  upsertPos(data: UpsertPosChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.upsertChannel({
      type: CatalogChannelTypeValues.POS,
      catalogId: data.catalogId,
      appId: null,
      terminalId: data.terminalId ?? null,
    });
  }

  // Makes a catalog available to wholesale buyers — through one wholesale site, or every unnamed caller
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
    return { success: true, message: `${channel.type} channel removed from "${channel.catalogName}".` };
  }

  // Excludes or re-includes one item on one channel, either outright or in one currency only
  async setItemVisibility(
    channelId: string,
    listingId: string,
    availableHere: boolean,
    currencyCode?: string | null,
  ): Promise<SuccessResponseDto> {
    const channel = await this.requireChannel(channelId, { owned: true });
    const listing = await this.repository.findListingInCatalog(listingId, channel.catalogId);
    if (!listing) throw new NotFoundException('That item is not in this channel’s catalog.');

    const currency = currencyCode ?? null;
    if (availableHere) {
      await this.repository.removeExclusion(listingId, channelId, currency);
    } else {
      await this.repository.addExclusion(listingId, channelId, currency);
    }

    const where = currency ? ` in ${currency}` : '';
    return {
      success: true,
      message: availableHere
        ? `"${listing.code}" is now available on this channel${where}.`
        : `"${listing.code}" is now excluded from this channel${where}.`,
    };
  }

  // What this storefront can switch between: the currencies its resolved catalog carries. Empty when
  // the credential resolves to no channel, which a switcher renders as "no choice" rather than an error.
  async appCurrencies(appId: string): Promise<string[]> {
    const channel = await this.repository.resolveCatalogChannel({ type: CatalogChannelTypeValues.APP, appId });
    if (!channel) return [];
    return this.repository.findCatalogCurrencies(channel.catalogId);
  }

  // One page of what a storefront makes available, through the APP channel its credential resolves to
  async appCatalogChannelListings(
    appId: string,
    query: ListingQueryDto,
    currencyCode: string,
  ): Promise<StorefrontListingsDto> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? LISTINGS_PER_PAGE;

    const channel = await this.repository.resolveCatalogChannel({ type: CatalogChannelTypeValues.APP, appId });
    if (!channel) return { items: [], total: 0, page, perPage };

    const { rows, total } = await this.repository.findListings(
      channel,
      {
        filters: query.filters ?? [],
        page,
        perPage,
        sort: query.sort ?? ListingSortValues.FEATURED,
      },
      currencyCode,
    );
    return { items: rows.map((row) => StorefrontListingDto.from(row)), total, page, perPage };
  }

  // One listing by code, with the axes a product page switches on.
  //
  // By code because that is what a storefront puts in its address bar: the code already names the
  // offering and one value per dimension, so the URL says what the page is and needs no second
  // lookup to be readable. Null when this shop does not offer it, which a page renders as "not
  // found" rather than guessing.
  async appListingByCode(appId: string, code: string, currencyCode: string): Promise<CatalogListingDetailDto | null> {
    const channel = await this.repository.resolveCatalogChannel({ type: CatalogChannelTypeValues.APP, appId });
    if (!channel) return null;

    const row = await this.repository.findListingByCode(channel, code, currencyCode);
    if (!row) return null;

    const siblings = await this.repository.findAvailableSiblings(channel, row.offeringId, currencyCode);
    return {
      listing: StorefrontListingDto.from(row),
      axes: buildVariantAxes(siblings, row.offeringVariantId),
    };
  }

  // Prices variants the caller already holds, against the same credential's catalog — optionally
  // narrowed, so a caller can ask "which of these are ready to cook" in one read rather than pricing
  // all of them and sorting it out itself.
  async appListingsByCodes(
    appId: string,
    codes: string[],
    currencyCode: string,
    filters: ListingFilterSelection[] = [],
  ): Promise<StorefrontListingDto[]> {
    const channel = await this.repository.resolveCatalogChannel({ type: CatalogChannelTypeValues.APP, appId });
    if (!channel) return [];

    const rows = await this.repository.findListingsByCodes(channel, codes, currencyCode, filters);
    return rows.map((row) => StorefrontListingDto.from(row));
  }

  // The filter rail: dimension groups then attribute groups, each value carrying a listing count.
  //
  // The unfiltered pass always runs, because it is the only thing that knows the full set of groups
  // and values. Narrowing then overwrites the counts it can and leaves the rest at zero, which is how
  // a value that would return nothing still renders — as a disabled zero rather than vanishing, so the
  // rail does not reshape itself under the pointer.
  async appListingFilters(appId: string, selected: ListingFilterSelection[]): Promise<ListingFilterDto[]> {
    const channel = await this.repository.resolveCatalogChannel({ type: CatalogChannelTypeValues.APP, appId });
    if (!channel) return [];

    const groups = await this.readFilterGroups(channel);
    if (channel.catalogFilterMode === CatalogFilterModeValues.NARROWING) {
      await this.narrowCounts(
        channel,
        groups,
        selected.filter((entry) => entry.values.length > 0),
      );
    }
    return groups;
  }

  // Each group is counted with every OTHER group's selections applied, but never its own. Applying the
  // whole filter instead would compute Chocolate as "Kesar Badam AND Chocolate" the moment Kesar Badam
  // is ticked, zeroing every other flavour and making a second flavour unselectable forever.
  //
  // So: one pass for the unselected groups with the full filter, plus one per selected group.
  private async narrowCounts(
    channel: StorefrontChannel,
    groups: ListingFilterDto[],
    selected: ListingFilterSelection[],
  ): Promise<void> {
    const selectedCodes = new Set(selected.map((entry) => entry.code));
    const passes = [
      { codes: groups.map((g) => g.code).filter((code) => !selectedCodes.has(code)), filters: selected },
      ...selected.map((entry) => ({
        codes: [entry.code],
        filters: selected.filter((other) => other.code !== entry.code),
      })),
    ];

    const results = await Promise.all(
      passes.map(async (pass) => ({
        codes: new Set(pass.codes),
        groups: await this.readFilterGroups(channel, CatalogChannelsDomainRepository.filtersWhere(pass.filters)),
      })),
    );

    const narrowed = new Map<string, number>();
    for (const result of results) {
      for (const group of result.groups) {
        if (!result.codes.has(group.code)) continue;
        for (const value of group.values) narrowed.set(`${group.code}|${value.code}`, value.count);
      }
    }

    for (const group of groups) {
      for (const value of group.values) {
        value.count = narrowed.get(`${group.code}|${value.code}`) ?? 0;
      }
    }
  }

  // Dimensions first, attributes after — the order the rail renders them in
  private async readFilterGroups(channel: StorefrontChannel, where?: SQL): Promise<ListingFilterDto[]> {
    const [dimensions, attributes] = await Promise.all([
      this.repository.findListingDimensions(channel, where),
      this.repository.findListingAttributes(channel, where),
    ]);
    return [
      ...ListingFilterDto.group(dimensions, ListingFilterKindValues.DIMENSION),
      ...ListingFilterDto.group(attributes, ListingFilterKindValues.ATTRIBUTE),
    ];
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
      message: `Now carrying "${catalog.name}".`,
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
      detail: `${subject} already carries "${current.catalogName}". Pick a different catalog, or leave it as it is.`,
      errors: [{ field: 'catalogId', message: 'Already in use here' }],
    });
  }

  // A named app or terminal is an exception to a default, so there has to be a default to except
  // from. Without this a workspace could name one app and leave every other caller with nothing.
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
