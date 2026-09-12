import type { CreateAppChannelDto, UpdateAppChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import type {
  CatalogChannelResponseDto,
  CatalogChannelTableResponseDto,
} from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import type {
  ChannelItemResponseDto,
  ChannelItemTableResponseDto,
} from '@commerce/catalog-channels/dto/response/channel-item-response.dto';
import { AppDomainRepository } from '@domain/app/repositories/app.repository';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

const TABLE_SLUG = 'commerce-site-app-channels';

@Injectable()
export class SiteAppCatalogChannelGatewayService {
  private readonly logger = new Logger(SiteAppCatalogChannelGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appRepository: AppDomainRepository,
  ) {}

  // Returns paginated App channels, labelled from the core app registry — commerce stores app_id opaquely
  async findForTable(userId: string, organizationId: string): Promise<CatalogChannelTableResponseDto> {
    this.logger.log('site.appCatalogChannels.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, TABLE_SLUG);
    const [{ result, count }, apps] = await Promise.all([
      this.nats.send<{ result: CatalogChannelResponseDto[]; count: number }>(
        'commerce',
        'site.appCatalogChannels.table',
        state,
      ),
      this.appRepository.findAllByOrg(organizationId),
    ]);

    const names = new Map(apps.filter((app) => !app.revokedAt).map((app) => [app.id, app.name]));
    return {
      result: result.map((row) => ({ ...row, label: this.labelOf(row, names) })),
      count,
      state,
      activeViewId,
    };
  }

  async create(dto: CreateAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`site.appCatalogChannels.create — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.create', {
      type: 'APP',
      catalogId: dto.catalogId,
      appId: dto.appId ?? null,
    });
  }

  async update(channelId: string, dto: UpdateAppChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.appCatalogChannels.update — channelId: ${channelId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.update', {
      channelId,
      catalogId: dto.catalogId,
    });
  }

  async remove(channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.appCatalogChannels.delete — channelId: ${channelId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.delete', { channelId });
  }

  // Returns paginated items of one channel for the data table
  async findItemsForTable(userId: string, channelId: string): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`site.appCatalogChannels.items — channelId: ${channelId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `${TABLE_SLUG}-${channelId}-items`,
    );
    const { result, count } = await this.nats.send<{ result: ChannelItemResponseDto[]; count: number }>(
      'commerce',
      'site.appCatalogChannels.items',
      { channelId, state },
    );
    return { result, count, state, activeViewId };
  }

  async setItemVisibility(channelId: string, listingId: string, sellsHere: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`site.appCatalogChannels.setItemVisibility — listingId: ${listingId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.setItemVisibility', {
      channelId,
      listingId,
      sellsHere,
    });
  }

  // Only the gateway can name an app, so the label is assembled here rather than in commerce
  private labelOf(row: CatalogChannelResponseDto, names: Map<string, string>): string {
    if (row.isFallback) return 'Any app';
    return row.terminalName ?? (row.appId ? (names.get(row.appId) ?? 'Revoked app') : 'Unnamed target');
  }
}
