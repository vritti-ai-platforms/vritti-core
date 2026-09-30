import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/data-table';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { CatalogChannelTypeValues, offeringVariants } from '@/db/schema';
import {
  CatalogChannelDto,
  type CatalogChannelRow,
  ChannelAssignmentDto,
  ChannelItemDto,
  ChannelResolutionDto,
  ChannelScreenEntryDto,
  ChannelTargetDto,
  ResolvedCatalogDto,
} from '../dto/entity/catalog-channel.dto';
import type {
  CreateAppChannelDto,
  CreateB2bChannelDto,
  CreatePosChannelDto,
  ResolveCatalogChannelDto,
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

  /**
   * Everything the channels screen needs, in one read.
   *
   * Per type: the effective default (the most specific wildcard in reach) and one entry per named
   * target. POS targets are completed here because pos_terminals is local; APP targets carry a null
   * name because apps live in core, and the gateway fills them in against the organization's apps.
   */
  async screen(): Promise<ChannelScreenEntryDto[]> {
    const [rows, terminals] = await Promise.all([this.repository.findAllInReach(), this.repository.findTerminals()]);

    return Object.values(CatalogChannelTypeValues).map((type) => {
      const ofType = rows.filter((row) => row.type === type);
      const entry = new ChannelScreenEntryDto();
      entry.type = type;
      entry.defaultAssignment = this.best(ofType.filter((row) => !row.appId && !row.terminalId));

      if (type === CatalogChannelTypeValues.B2B) {
        entry.targets = null;
        return entry;
      }

      const named = ofType.filter((row) => (type === CatalogChannelTypeValues.APP ? row.appId : row.terminalId));
      entry.targets =
        type === CatalogChannelTypeValues.POS
          ? terminals.map((terminal) => this.target(terminal.id, terminal.name, named, 'terminalId'))
          : this.appTargets(named);
      return entry;
    });
  }

  async findById(id: string): Promise<CatalogChannelDto> {
    return CatalogChannelDto.from(await this.requireChannel(id));
  }

  async findByCatalog(catalogId: string): Promise<CatalogChannelDto[]> {
    const rows = await this.repository.findByCatalog(catalogId);
    return rows.map((row) => CatalogChannelDto.from(row));
  }

  // Sells a catalog through an app, or through every unnamed caller when appId is absent
  createApp(data: CreateAppChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.createChannel({
      type: CatalogChannelTypeValues.APP,
      catalogId: data.catalogId,
      appId: data.appId ?? null,
      terminalId: null,
    });
  }

  // Sells a catalog at one terminal, or at every terminal in reach when terminalId is absent
  createPos(data: CreatePosChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.createChannel({
      type: CatalogChannelTypeValues.POS,
      catalogId: data.catalogId,
      appId: null,
      terminalId: data.terminalId ?? null,
    });
  }

  // Sells a catalog to wholesale buyers. B2B names no target, so this is one assignment per workspace
  createB2b(data: CreateB2bChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    return this.createChannel({
      type: CatalogChannelTypeValues.B2B,
      catalogId: data.catalogId,
      appId: null,
      terminalId: null,
    });
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

  // The one write path behind the three typed entry points. The workspace columns are left to their
  // GUC defaults, so the row stamps itself with whichever workspace is asking.
  private async createChannel(target: ChannelTarget): Promise<CreateResponseDto<CatalogChannelDto>> {
    const catalog = await this.repository.findCatalog(target.catalogId);
    if (!catalog) throw new NotFoundException('Catalog not found.');
    await this.assertNotTaken(target);

    const entity = await this.repository.create({
      catalogId: target.catalogId,
      type: target.type,
      appId: target.appId,
      terminalId: target.terminalId,
    });

    this.logger.log(`Created ${target.type} channel for catalog ${target.catalogId}`);
    return {
      success: true,
      message: `Now selling "${catalog.name}".`,
      data: await this.findById(entity.id),
    };
  }

  // Rejects a second assignment to the same target before the unique index has to. Named targets are
  // checked too: without this a repeat app or terminal surfaces as a raw unique violation, not a 409
  private async assertNotTaken(target: ChannelTarget): Promise<void> {
    const existing = await this.repository.findOwnChannel(target);
    if (!existing) return;

    const named = target.appId ? 'this app' : target.terminalId ? 'this terminal' : null;
    throw new ConflictException({
      label: 'Already Assigned',
      detail: named
        ? `${target.type} already sells a catalog to ${named} at this scope. Change the existing one instead.`
        : `${target.type} already sells a catalog at this scope. Change the existing one instead.`,
    });
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

  // The winning row of a candidate set, or nothing when the set is empty
  private best(candidates: CatalogChannelRow[]): ChannelAssignmentDto | null {
    if (candidates.length === 0) return null;
    const [winner] = [...candidates].sort((a, b) => this.specificity(b) - this.specificity(a));
    return ChannelAssignmentDto.from(winner);
  }

  // One grid entry: the target, plus the most specific row naming it, or nothing when it follows the default
  private target(
    targetId: string,
    name: string | null,
    named: CatalogChannelRow[],
    key: 'appId' | 'terminalId',
  ): ChannelTargetDto {
    const entry = new ChannelTargetDto();
    entry.targetId = targetId;
    entry.name = name;
    entry.assignment = this.best(named.filter((row) => row[key] === targetId));
    return entry;
  }

  // Apps are only known here by id — the gateway names them from core and adds the ones with no row yet
  private appTargets(named: CatalogChannelRow[]): ChannelTargetDto[] {
    const appIds = [...new Set(named.map((row) => row.appId as string))];
    return appIds.map((appId) => this.target(appId, null, named, 'appId'));
  }

  // A named target outranks its scope, because naming one app or terminal is a deliberate exception
  private specificity(row: CatalogChannelRow): number {
    return (row.terminalId ? 8 : 0) + (row.appId ? 8 : 0) + (row.siteId ? 4 : 0) + (row.legalEntityId ? 2 : 0);
  }
}
