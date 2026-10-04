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
} from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { OwnerNameService } from '@/owner-names/owner-name.service';
import type { CatalogListing } from '../../../org-api/catalog-channels/graphql/catalog-listing.type';

const ITEMS_TABLE_SLUG = (channelId: string) => `commerce-site-channel-${channelId}-items`;

@Injectable()
export class SiteCatalogChannelsGatewayService {
  private readonly logger = new Logger(SiteCatalogChannelsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appRepository: AppDomainRepository,
    private readonly ownerNames: OwnerNameService,
  ) {}

  /**
   * The whole channels list in one read.
   *
   * commerce resolves which catalog each configured slot uses; the two lists of what exists come
   * separately — terminals from commerce, apps from core's own table. Joining decisions to estate is
   * what turns them into a page, and it happens once for both kinds rather than once per kind.
   */
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
      // Only POS names a till. APP and B2B both name an app — which of the two a caller resolves
      // through comes from the party buying, not from the site.
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

  // The storefront's range — one call, because commerce resolves the channel and joins the prices
  async appListings(appId: string, variantIds?: string[]): Promise<CatalogListing[]> {
    if (variantIds) {
      this.logger.log(`site.catalogChannels.app.listingsFromVariants — ${variantIds.length} variants`);
      return this.nats.send('commerce', 'site.catalogChannels.app.listingsFromVariants', { appId, variantIds });
    }
    this.logger.log('site.catalogChannels.app.listings');
    return this.nats.send('commerce', 'site.catalogChannels.app.listings', { appId });
  }

  async upsertApp(dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`site.appCatalogChannels.upsert — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.upsert', {
      catalogId: dto.catalogId,
      appId: dto.appId ?? null,
    });
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

  async setItemVisibility(channelId: string, listingId: string, sellsHere: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`site.catalogChannels.setItemVisibility — listingId: ${listingId}`);
    return this.nats.send('commerce', 'site.catalogChannels.setItemVisibility', {
      channelId,
      listingId,
      sellsHere,
    });
  }

  /**
   * Every app or terminal that exists, each carrying what it will sell.
   *
   * Driven off the list of things that exist rather than the decisions, so a target nobody has
   * overridden still appears — using the default. A decision whose app or terminal has since gone is
   * added back at the end, because dropping it would hide an assignment that is still live.
   */
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
