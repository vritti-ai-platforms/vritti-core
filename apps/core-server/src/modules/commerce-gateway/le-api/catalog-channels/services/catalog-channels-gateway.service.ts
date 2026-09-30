import type { CreateB2bChannelDto, CreatePosChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import type {
  CatalogChannelResponseDto,
  ChannelAssignmentResponseDto,
  ChannelScreenEntryResponseDto,
  ChannelTargetResponseDto,
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

const ITEMS_TABLE_SLUG = (channelId: string) => `commerce-le-channel-${channelId}-items`;

@Injectable()
export class LeCatalogChannelsGatewayService {
  private readonly logger = new Logger(LeCatalogChannelsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
    private readonly appRepository: AppDomainRepository,
    private readonly ownerNames: OwnerNameService,
  ) {}

  /**
   * The whole channels screen in one read.
   *
   * commerce returns POS targets complete, because pos_terminals is its own table, but APP targets
   * only by id — apps live in core. They are named here, and every app with no assignment yet is
   * added, so the grid lists the estate rather than only the exceptions.
   */
  async screen(orgId: string): Promise<ChannelScreenEntryResponseDto[]> {
    this.logger.log('le.catalogChannels.screen');
    const [entries, apps] = await Promise.all([
      this.nats.send<ChannelScreenEntryResponseDto[]>('commerce', 'le.catalogChannels.screen', {}),
      this.appRepository.findAllByOrg(orgId),
    ]);

    const live = apps.filter((app) => !app.revokedAt);
    for (const entry of entries) {
      if (entry.type === 'APP') entry.targets = this.nameApps(entry.targets ?? [], live);
    }

    await this.stampOwnerNames(orgId, entries);
    return entries;
  }

  async createPos(dto: CreatePosChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`le.posCatalogChannels.create — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'le.posCatalogChannels.create', dto);
  }

  async createB2b(dto: CreateB2bChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`le.b2bCatalogChannels.create — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'le.b2bCatalogChannels.create', dto);
  }

  // Everything below keys on channelId and is type-neutral — only creation differs per type
  async update(channelId: string, catalogId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogChannels.update — channelId: ${channelId}`);
    return this.nats.send('commerce', 'le.catalogChannels.update', { channelId, catalogId });
  }

  async remove(channelId: string): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogChannels.delete — channelId: ${channelId}`);
    return this.nats.send('commerce', 'le.catalogChannels.delete', { channelId });
  }

  async findItemsForTable(userId: string, channelId: string): Promise<ChannelItemTableResponseDto> {
    this.logger.log(`le.catalogChannels.items — channelId: ${channelId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      ITEMS_TABLE_SLUG(channelId),
    );
    const { result, count } = await this.nats.send<{ result: ChannelItemResponseDto[]; count: number }>(
      'commerce',
      'le.catalogChannels.items',
      { channelId, state },
    );
    return { result, count, state, activeViewId };
  }

  async setItemVisibility(channelId: string, listingId: string, sellsHere: boolean): Promise<SuccessResponseDto> {
    this.logger.log(`le.catalogChannels.setItemVisibility — listingId: ${listingId}`);
    return this.nats.send('commerce', 'le.catalogChannels.setItemVisibility', {
      channelId,
      listingId,
      sellsHere,
    });
  }

  // One tile per app in the organization, plus any assignment whose app has since been revoked —
  // dropping those would hide a live assignment
  private nameApps(targets: ChannelTargetResponseDto[], apps: { id: string; name: string }[]) {
    const assigned = new Map(targets.map((target) => [target.targetId, target.assignment]));
    const known = new Set(apps.map((app) => app.id));
    return [
      ...apps.map((app) => ({ targetId: app.id, name: app.name, assignment: assigned.get(app.id) ?? null })),
      ...targets.filter((target) => !known.has(target.targetId)).map((target) => ({ ...target, name: 'Removed app' })),
    ];
  }

  // commerce stores only the owning ids; the names live in core. One batched pass over the screen.
  private async stampOwnerNames(orgId: string, entries: ChannelScreenEntryResponseDto[]): Promise<void> {
    const assignments = entries
      .flatMap((entry) => [entry.defaultAssignment, ...(entry.targets ?? []).map((target) => target.assignment)])
      .filter((assignment): assignment is ChannelAssignmentResponseDto => assignment !== null);
    if (assignments.length === 0) return;

    const named = await this.ownerNames.resolve(orgId, assignments);
    const byChannel = new Map(named.map((assignment) => [assignment.channelId, assignment.ownerName]));
    for (const assignment of assignments) {
      assignment.ownerName = byChannel.get(assignment.channelId) ?? 'Unknown';
    }
  }
}
