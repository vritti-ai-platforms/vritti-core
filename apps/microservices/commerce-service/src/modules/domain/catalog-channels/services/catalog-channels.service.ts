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
  ChannelResolutionDto,
  DEFAULT_SLOT,
  type ResolvedChannelsDto,
} from '../dto/entity/catalog-channel.dto';
import { StorefrontListingDto } from '../dto/entity/storefront-listing.dto';
import type {
  ResolveCatalogChannelDto,
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

  /**
   * Which catalog every configured slot resolves to, keyed for lookup.
   *
   * Every channel type, at every workspace. An app resolves its catalog against whichever workspace
   * its request authenticated to, so a company or an outlet may give an app its own catalog.
   *
   * Decisions only — an app or terminal that has never been overridden has no row and so appears
   * nowhere here. Naming the estate is core's job, because that is where both lists are reachable.
   */
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

  /**
   * What a storefront sells, resolved through its own APP channel.
   *
   * `variantIds` narrows to a known set — a wishlist or a basket reconciling rows it already holds.
   * Omitted, it is the whole range. Either way the catalog comes from the credential, never from the
   * caller, so a storefront cannot read a range it was not given.
   */
  async appListings(appId: string, variantIds?: string[]): Promise<StorefrontListingDto[]> {
    const rows = await this.repository.findAppListings(appId, variantIds);
    return rows.map((row) => StorefrontListingDto.from(row));
  }

  /**
   * Which catalog serves this caller right now — the runtime lookup behind a basket or a storefront.
   *
   * The caller's type comes from the API surface it authenticated against, never from the request,
   * and the workspace is the request's RLS context. Most specific wins: a named app or terminal beats
   * the default, a site beats a company, a company beats the organization.
   *
   * Never throws. A basket is a list of things someone wants; whether the shop can price them is a
   * separate question, and answering it "no" must not stop the basket being opened or added to.
   */
  async tryResolve(data: ResolveCatalogChannelDto): Promise<ChannelResolutionDto> {
    return ChannelResolutionDto.from(await this.repository.findWinningCandidate(data));
  }

  /**
   * The one write path behind the three typed entry points.
   *
   * A workspace holds at most one row per slot, so assigning is an upsert: repoint the row this
   * workspace already owns, or stamp a new one. A new row leaves the workspace columns to their GUC
   * defaults, which is what makes an assignment under an inherited one an override of it rather than
   * an edit of it — the wider level's row is untouched and keeps serving everyone else.
   */
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

  /**
   * Refuses an assignment that would change nothing.
   *
   * An override exists to differ from what a target already gets; pointing one at the same catalog
   * it already inherits just adds a row that resolves identically, and leaves the user believing
   * they changed something. Resolution is the same ranking the list reads, so this compares against
   * exactly what that target sells today.
   */
  private async assertChangesSomething(target: ChannelTarget): Promise<void> {
    const { catalog } = await this.tryResolve({
      type: target.type,
      appId: target.appId,
      terminalId: target.terminalId,
    });
    if (catalog?.catalogId !== target.catalogId) return;

    const subject = target.appId || target.terminalId ? 'This target' : 'This level';
    throw new ConflictException({
      label: 'Already Using This Catalog',
      detail: `${subject} already sells "${catalog.catalogName}". Pick a different catalog, or leave it as it is.`,
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

  /**
   * Fetch or 404. Named require, not find, because it never hands back an undefined to deal with.
   *
   * `owned` additionally refuses a channel a wider scope set: editing or deleting it there would move
   * the catalog for every level beneath it too, so this workspace has to override instead. Reading an
   * inherited channel is fine, which is why it is a choice rather than the rule.
   */
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
