import type {
  UpsertAppChannelDto,
  UpsertB2bChannelDto,
  UpsertPosChannelDto,
} from '@commerce/catalog-channels/dto/request/app-channel.dto';
import {
  CatalogChannelTypeValues,
  CHANNEL_TYPES,
} from '@commerce/catalog-channels/dto/request/create-catalog-channel.dto';
import {
  type CatalogChannelResponseDto,
  type ChannelCatalogResponseDto,
  ChannelEntryResponseDto,
  type ChannelTargetResponseDto,
  DEFAULT_SLOT,
  type ResolvedChannels,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type {
  ChannelItemResponseDto,
  ChannelItemTableResponseDto,
  ChannelPriceResponseDto,
  ChannelPriceTableResponseDto,
} from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import type { CatalogListing } from '../../../org-api/catalog-channels/graphql/catalog-listing.type';
import type {
  CatalogListingDetail,
  CatalogListings,
  FilterInput,
  ListingFilter,
  ListingQuery,
} from '../../../org-api/catalog-channels/graphql/catalog-listings.type';

const ITEMS_TABLE_SLUG = (channelId: string) => `commerce-site-channel-${channelId}-items`;
const PRICES_TABLE_SLUG = (channelId: string) => `commerce-site-channel-${channelId}-prices`;

@Injectable()
export class SiteCatalogChannelsGatewayService {
  private readonly logger = new Logger(SiteCatalogChannelsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appRepository: AppDomainRepository,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // The whole channels list in one read
  async list(orgId: string): Promise<ChannelEntryResponseDto[]> {
    this.logger.log('site.catalogChannels.list');
    const [resolved, apps, terminals] = await Promise.all([
      this.nats.send<ResolvedChannels>('commerce', 'site.catalogChannels.list', {}),
      this.appRepository.findAllByOrg(orgId),
      this.nats.send<{ id: string; name: string }[]>('commerce', 'site.posTerminals.list', {}),
    ]);

    const liveApps = apps.filter((app) => !app.revokedAt).map((app) => ({ id: app.id, name: app.name }));

    const entries = CHANNEL_TYPES.map((type) => {
      const slots = resolved[type] ?? {};
      const defaultCatalog = slots[DEFAULT_SLOT] ?? null;
      const existing = type === CatalogChannelTypeValues.POS ? terminals : liveApps;

      const entry = new ChannelEntryResponseDto();
      entry.type = type;
      entry.defaultCatalog = defaultCatalog;
      entry.targets = this.buildTargets(slots, defaultCatalog, existing);
      return entry;
    });

    await this.stampOwnerNames(orgId, entries);
    return entries;
  }

  // The storefront's range — one call, because commerce resolves the channel and joins the prices The page plus what
  // the lazy `filters` field will need, so the channel resolves once per request
  async appCatalogChannelListings(appId: string, query: ListingQuery, currencyCode: string): Promise<CatalogListings> {
    this.logger.log(`site.catalogChannels.app.listings — page: ${query.page ?? 1}`);
    const page = await this.nats.send<Omit<CatalogListings, 'filters' | 'appId' | 'selected' | 'scope'>>(
      'commerce',
      'site.catalogChannels.app.listings',
      { appId, currencyCode, ...query },
    );
    return { ...page, filters: [], appId, selected: query.filters ?? [], scope: 'site' };
  }

  // One listing by code, with the variant axes a product page switches on
  async appListingByCode(appId: string, code: string, currencyCode: string): Promise<CatalogListingDetail | null> {
    this.logger.log(`site.catalogChannels.app.listingByCode — code: ${code}`);
    return this.nats.send('commerce', 'site.catalogChannels.app.listingByCode', { appId, code, currencyCode });
  }

  // Only sent when the client selected the `filters` field — see CatalogListingsFieldsResolver
  async appListingFilters(appId: string, filters: FilterInput[]): Promise<ListingFilter[]> {
    this.logger.log(`site.catalogChannels.app.listingFilters — selected: ${filters.length}`);
    return this.nats.send('commerce', 'site.catalogChannels.app.listingFilters', { appId, filters });
  }

  // Prices variants the caller already holds — a wishlist or a basket The currencies this storefront's catalog carries
  // — what its switcher may offer
  async appCurrencies(appId: string): Promise<string[]> {
    this.logger.log(`site.catalogChannels.app.currencies — appId: ${appId}`);
    return this.nats.send('commerce', 'site.catalogChannels.app.currencies', { appId });
  }

  async appListingsByCodes(
    appId: string,
    codes: string[],
    currencyCode: string,
    filters: FilterInput[] = [],
  ): Promise<CatalogListing[]> {
    this.logger.log(`site.catalogChannels.app.listingsByCodes — ${codes.length} codes`);
    return this.nats.send('commerce', 'site.catalogChannels.app.listingsByCodes', {
      appId,
      codes,
      currencyCode,
      filters,
    });
  }

  async upsertApp(dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`site.appCatalogChannels.upsert — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.upsert', dto);
  }

  async upsertPos(dto: UpsertPosChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`site.posCatalogChannels.upsert — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'site.posCatalogChannels.upsert', dto);
  }

  async upsertB2b(dto: UpsertB2bChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`site.b2bCatalogChannels.upsert — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'site.b2bCatalogChannels.upsert', dto);
  }

  // Everything below keys on channelId and is type-neutral — only creation differs per type
  async remove(channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogChannels.delete — channelId: ${channelId}`);
    return this.nats.send('commerce', 'site.catalogChannels.delete', { channelId });
  }

  async findItemsForTable(userId: string, channelId: string): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`site.catalogChannels.items — channelId: ${channelId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      ITEMS_TABLE_SLUG(channelId),
    );
    const { result, count } = await this.nats.send<{ result: ChannelItemResponseDto[]; count: number }>(
      'commerce',
      'site.catalogChannels.items',
      { channelId, state },
    );
    return { result, count, state, activeViewId };
  }

  async findCurrencies(channelId: string): Promise<string[]> {
    this.logger.log(`site.catalogChannels.currencies — channelId: ${channelId}`);
    return this.nats.send('commerce', 'site.catalogChannels.currencies', { channelId });
  }

  // One currency's prices for this channel.
  // One currency's prices for this channel. Shares one saved view across currencies — same columns.
  async findPricesForTable(
    orgId: string,
    userId: string,
    channelId: string,
    currencyCode: string,
  ): Promise<ChannelPriceTableResponseDto> {
    this.logger.log(`site.catalogChannels.prices — channelId: ${channelId}, currency: ${currencyCode}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      PRICES_TABLE_SLUG(channelId),
    );
    const { result, count } = await this.nats.send<{ result: ChannelPriceResponseDto[]; count: number }>(
      'commerce',
      'site.catalogChannels.prices',
      { channelId, currencyCode, state },
    );
    // commerce stores only the owning ids; the names live in core
    return { result: await this.namePriceOwners(orgId, result), count, state, activeViewId };
  }

  async setItemVisibility(
    channelId: string,
    listingId: string,
    availableHere: boolean,
    currencyCode?: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `site.catalogChannels.setItemVisibility — listingId: ${listingId}, currency: ${currencyCode ?? 'all'}`,
    );
    return this.nats.send('commerce', 'site.catalogChannels.setItemVisibility', {
      channelId,
      listingId,
      availableHere,
      currencyCode: currencyCode ?? null,
    });
  }

  // A price carries the workspace that set it, so an inherited one can say whose it is
  private async namePriceOwners(orgId: string, rows: ChannelPriceResponseDto[]): Promise<ChannelPriceResponseDto[]> {
    const priced = rows.filter((row) => row.priceOwnerScope !== null);
    if (priced.length === 0) return rows.map((row) => ({ ...row, priceOwnerName: null }));

    const named = await this.ownerNames.resolve(
      orgId,
      priced.map((row) => ({
        ownerScope: row.priceOwnerScope as string,
        legalEntityId: row.priceLegalEntityId,
        siteId: row.priceSiteId,
        listingId: row.listingId,
      })),
    );
    const byListing = new Map(named.map((row) => [row.listingId, row.ownerName]));
    return rows.map((row) => ({ ...row, priceOwnerName: byListing.get(row.listingId) ?? null }));
  }

  // Every app or terminal that exists, each carrying what it will offer
  private buildTargets(
    slots: Record<string, ChannelCatalogResponseDto>,
    defaultCatalog: ChannelCatalogResponseDto | null,
    existing: { id: string; name: string }[] | null,
  ): ChannelTargetResponseDto[] | null {
    if (existing === null) return null;
    // An override is an exception to a default, so until one exists there is nothing to except from
    if (!defaultCatalog) return [];

    const known = new Set(existing.map((target) => target.id));
    return [
      ...existing.map((target) => ({
        targetId: target.id,
        name: target.name,
        catalog: slots[target.id] ?? defaultCatalog,
        isAssigned: Boolean(slots[target.id]),
      })),
      ...Object.entries(slots)
        .filter(([id]) => id !== DEFAULT_SLOT && !known.has(id))
        .map(([id, catalog]) => ({ targetId: id, name: 'Removed', catalog, isAssigned: true })),
    ];
  }

  // commerce stores only the owning ids; the names live in core. commerce stores only the owning ids; the names live in
  // core.
  // commerce stores only the owning ids; the names live in core. One batched pass over the list.
  private async stampOwnerNames(orgId: string, entries: ChannelEntryResponseDto[]): Promise<void> {
    const catalogs = entries
      .flatMap((entry) => [entry.defaultCatalog, ...(entry.targets ?? []).map((target) => target.catalog)])
      .filter((catalog): catalog is ChannelCatalogResponseDto => catalog !== null);
    if (catalogs.length === 0) return;

    const named = await this.ownerNames.resolve(orgId, catalogs);
    const byChannel = new Map(named.map((catalog) => [catalog.channelId, catalog.ownerName]));
    for (const catalog of catalogs) {
      catalog.ownerName = byChannel.get(catalog.channelId) ?? 'Unknown';
    }
  }
}
