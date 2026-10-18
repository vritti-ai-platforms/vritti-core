import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { catalogListings, type InventoryItemMrp, offeringVariants } from '@/db/schema';
import { CatalogListingDto, type CatalogListingRow } from '../dto/entity/catalog-listing.dto';
import type { AddCatalogListingDto } from '../dto/request/add-catalog-listing.dto';
import type { AddCatalogListingsBatchDto } from '../dto/request/add-catalog-listings-batch.dto';
import type {
  BulkRemoveCatalogListingsDto,
  BulkSetCatalogListingAvailabilityDto,
  BulkSetCatalogListingPriceDto,
} from '../dto/request/bulk-catalog-listings.dto';
import type { SetCatalogListingPriceDto } from '../dto/request/set-catalog-listing-price.dto';
import { CatalogListingsDomainRepository } from '../repositories/catalog-listings.repository';
import { CatalogsDomainRepository } from '../repositories/catalogs.repository';

@Injectable()
export class CatalogListingsDomainService {
  private readonly logger = new Logger(CatalogListingsDomainService.name);

  constructor(
    private readonly repository: CatalogListingsDomainRepository,
    private readonly catalogsRepository: CatalogsDomainRepository,
  ) {}

  // Returns one page of a catalog's listings, each with its prices.
  async findForTable(
    catalogId: string,
    state: TableViewState,
    currencyCode?: string,
  ): Promise<{ result: CatalogListingDto[]; count: number }> {
    await this.requireCatalog(catalogId);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result: rows, count } = await this.repository.findForTable({
      where: eq(catalogListings.catalogId, catalogId) as SQL,
      orderBy: [asc(offeringVariants.code)],
      limit,
      offset,
    });
    const ids = rows.map((row) => row.id);
    const prices = await this.repository.findPrices(ids, currencyCode);
    const exclusions = await this.repository.findExclusions(ids);
    // Reads the channels once for the page — every listing in a catalog shares them
    const channelCount = (await this.catalogsRepository.findChannels(catalogId)).length;
    return {
      result: rows.map((row) =>
        CatalogListingDto.from(
          row,
          prices.filter((price) => price.catalogListingId === row.id),
          exclusions.filter((x) => x.catalogListingId === row.id).map((x) => x.catalogChannelId),
          channelCount,
        ),
      ),
      count,
    };
  }

  // Lists a variant in a catalog, optionally keyed to one MRP slice, with an optional opening price
  async add(data: AddCatalogListingDto): Promise<CreateResponseDto<CatalogListingDto>> {
    const catalog = await this.requireCatalog(data.catalogId);
    const mrpId = data.inventoryItemMrpId ?? null;
    await this.assertListingShape(data.catalogId, data.offeringVariantId, mrpId);

    const created = await this.repository.transaction(async () => {
      const item = await this.repository.insertListing({
        catalogId: data.catalogId,
        offeringVariantId: data.offeringVariantId,
        legalEntityId: data.legalEntityId ?? null,
        inventoryItemMrpId: mrpId,
      });
      if (data.price) {
        const amount = majorToMinor(data.price.value, data.price.currency as CurrencyCode, 'price');
        await this.assertWithinMrp(mrpId, amount, data.price.currency);
        await this.repository.upsertPrice(item.id, data.price.currency, amount);
      }
      return item;
    });

    this.logger.log(`Listed variant ${data.offeringVariantId} in catalog ${catalog.name} (mrp: ${mrpId ?? 'any'})`);
    const row = (await this.repository.findByIdWithRefs(created.id)) as CatalogListingRow;
    const prices = await this.repository.findPrices([created.id]);
    return {
      success: true,
      message: `"${row.code}" listed in "${catalog.name}".`,
      data: CatalogListingDto.from(row, prices),
    };
  }

  // Lists several variants at once, each optionally keyed to an MRP slice and opened at a price.
  async addBatch(data: AddCatalogListingsBatchDto): Promise<CreateResponseDto<CatalogListingDto[]>> {
    const catalog = await this.requireCatalog(data.catalogId);
    const variantIds = [...new Set(data.items.map((item) => item.offeringVariantId))];
    const codes = new Map((await this.repository.findVariantCodes(variantIds)).map((row) => [row.id, row.code]));
    const unknown = variantIds.filter((id) => !codes.has(id));
    if (unknown.length > 0) {
      throw new NotFoundException({
        label: 'Variants Not Found',
        detail: `${pluralize('variant', unknown.length, true)} in this batch no longer exist. Refresh and try again.`,
      });
    }

    // Every row is judged before any is written — the batch is one intent, and leaving half of a
    // priced-up offering in the catalog is harder to undo than refusing the lot
    const siblings = await this.repository.findSiblingListingsForVariants(data.catalogId, variantIds);
    const taken = new Map<string, (string | null)[]>(
      variantIds.map((id) => [id, siblings.filter((s) => s.offeringVariantId === id).map((s) => s.inventoryItemMrpId)]),
    );
    const mrps = new Map(
      (
        await this.repository.findMrpsByIds(
          data.items.map((item) => item.inventoryItemMrpId).filter((id): id is string => !!id),
        )
      ).map((mrp) => [mrp.id, mrp]),
    );

    const rows = data.items.map((item) => {
      const mrpId = item.inventoryItemMrpId ?? null;
      const subject = `"${codes.get(item.offeringVariantId)}"`;
      this.assertShapeAgainst(taken.get(item.offeringVariantId) ?? [], mrpId, subject);
      taken.get(item.offeringVariantId)?.push(mrpId);

      if (!item.price) return { item, mrpId, amount: null };
      const amount = majorToMinor(item.price.value, item.price.currency as CurrencyCode, 'price');
      this.assertPriceWithin(mrpId ? mrps.get(mrpId) : undefined, mrpId, amount, item.price.currency, subject);
      return { item, mrpId, amount };
    });

    const created = await this.repository.transaction(async () => {
      const listings = await this.repository.insertListings(
        rows.map(({ item, mrpId }) => ({
          catalogId: data.catalogId,
          offeringVariantId: item.offeringVariantId,
          legalEntityId: data.legalEntityId ?? null,
          inventoryItemMrpId: mrpId,
        })),
      );
      // Paired back by (variant, MRP) rather than by position: the shape rule makes that pair unique
      // within a batch, and RETURNING is under no obligation to echo the order it was given
      await this.repository.upsertPriceRows(
        rows.flatMap(({ item, mrpId, amount }) => {
          if (amount === null || !item.price) return [];
          const listing = listings.find(
            (row) => row.offeringVariantId === item.offeringVariantId && row.inventoryItemMrpId === mrpId,
          );
          return listing ? [{ catalogListingId: listing.id, currencyCode: item.price.currency, amount }] : [];
        }),
      );
      return listings;
    });

    this.logger.log(`Listed ${created.length} variants in catalog ${catalog.name}`);
    const ids = created.map((listing) => listing.id);
    const refs = await this.repository.findManyInCatalog(data.catalogId, ids);
    const prices = await this.repository.findPrices(ids);
    return {
      success: true,
      message: `${pluralize('listing', created.length, true)} added to "${catalog.name}".`,
      data: refs.map((row) =>
        CatalogListingDto.from(
          row,
          prices.filter((price) => price.catalogListingId === row.id),
        ),
      ),
    };
  }

  // Sets this workspace's own price for a listing; refused above the listing's printed MRP.
  async setPrice(data: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    const item = await this.requireReachable(data.catalogListingId);
    const amount = majorToMinor(data.price.value, data.price.currency as CurrencyCode, 'price');
    await this.assertWithinMrp(item.inventoryItemMrpId, amount, data.price.currency);
    await this.repository.upsertPrice(item.id, data.price.currency, amount);
    return {
      success: true,
      message: `"${item.code}" is now priced at ${data.price.currency} ${data.price.value} in this workspace.`,
    };
  }

  // Drops this workspace's own price, so whatever a wider workspace charges applies again.
  async clearPrice(data: { catalogListingId: string; currencyCode: string }): Promise<SuccessResponseDto> {
    const item = await this.requireReachable(data.catalogListingId);
    const removed = await this.repository.deleteOwnPrice(item.id, data.currencyCode);
    if (removed === 0) {
      throw new NotFoundException(`"${item.code}" has no ${data.currencyCode} price of its own in this workspace.`);
    }
    return { success: true, message: `${data.currencyCode} price cleared for "${item.code}".` };
  }

  // Available everywhere by default, so excluding writes one row and making it available again removes that row.
  async setChannelVisibility(id: string, catalogChannelId: string, visible: boolean): Promise<SuccessResponseDto> {
    const item = await this.requireReachable(id);
    await this.requireOwnedChannel(catalogChannelId);
    if (visible) await this.repository.removeExclusion(id, catalogChannelId);
    else await this.repository.addExclusion(id, catalogChannelId);
    return {
      success: true,
      message: visible
        ? `"${item.code}" is now available on this channel.`
        : `"${item.code}" is now excluded from this channel.`,
    };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const item = await this.requireOwned(id);
    await this.repository.deleteListing(id);
    return { success: true, message: `"${item.code}" removed from this catalog.` };
  }

  // Removes every selected listing from one catalog, or none of them
  async bulkRemove(data: BulkRemoveCatalogListingsDto): Promise<SuccessResponseDto> {
    const { catalog, listings } = await this.requireBatch(data.catalogId, data.ids);
    this.requireOwnedBatch(listings);
    const removed = await this.repository.deleteListings(listings.map((listing) => listing.id));
    return { success: true, message: `${pluralize('listing', removed, true)} removed from "${catalog.name}".` };
  }

  // Prices every selected listing the same, refused outright if any one of them is keyed to a lower MRP
  async bulkSetPrice(data: BulkSetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    const { catalog, listings } = await this.requireBatch(data.catalogId, data.ids);
    const amount = majorToMinor(data.price.value, data.price.currency as CurrencyCode, 'price');
    // Each one is checked before anything is written: a batch that would breach one printed ceiling is a
    // batch somebody selected by mistake, and half-pricing it is worse than pricing none of it.
    for (const listing of listings) {
      await this.assertWithinMrp(listing.inventoryItemMrpId, amount, data.price.currency);
    }
    await this.repository.upsertPrices(
      listings.map((listing) => listing.id),
      data.price.currency,
      amount,
    );
    return {
      success: true,
      message: `${pluralize('listing', listings.length, true)} in "${catalog.name}" now priced at ${data.price.currency} ${data.price.value} in this workspace.`,
    };
  }

  // Shows or hides every selected listing on every named channel
  async bulkSetAvailability(data: BulkSetCatalogListingAvailabilityDto): Promise<SuccessResponseDto> {
    const { catalog, listings } = await this.requireBatch(data.catalogId, data.ids);
    const unowned = await this.repository.findUnownedChannels(data.channelIds);
    if (unowned.length > 0) {
      throw new ForbiddenException({
        label: 'Not Your Channel',
        detail: `${pluralize('channel', unowned.length, true)} in this selection belong to a wider scope. Switch to the workspace that owns them to change what they carry.`,
      });
    }

    const ids = listings.map((listing) => listing.id);
    if (data.visible) await this.repository.removeExclusions(ids, data.channelIds);
    else await this.repository.addExclusions(ids, data.channelIds);

    const where = `${pluralize('channel', data.channelIds.length, true)}`;
    return {
      success: true,
      message: data.visible
        ? `${pluralize('listing', ids.length, true)} in "${catalog.name}" now available on ${where}.`
        : `${pluralize('listing', ids.length, true)} in "${catalog.name}" now excluded from ${where}.`,
    };
  }

  // Loads a whole selection, refusing it unless every id still belongs to the catalog being acted on
  private async requireBatch(catalogId: string, ids: string[]) {
    const catalog = await this.requireCatalog(catalogId);
    const listings = await this.repository.findManyInCatalog(catalogId, ids);
    if (listings.length !== ids.length) {
      throw new NotFoundException({
        label: 'Listings Not Found',
        detail: `Some of the selected listings are no longer in "${catalog.name}". Refresh and try again.`,
      });
    }
    return { catalog, listings };
  }

  // Refuses the batch when any row belongs to a wider workspace, naming them rather than the count
  private requireOwnedBatch(listings: CatalogListingRow[]): void {
    const inherited = listings.filter((listing) => !listing.isOwned);
    if (inherited.length === 0) return;
    throw new ForbiddenException({
      label: 'Not Your Listings',
      detail: `${inherited.map((listing) => `"${listing.code}"`).join(', ')} belong to a wider scope. Switch to the workspace that owns them.`,
    });
  }

  // Loads the channel behind an exclusion, throwing unless this workspace owns it
  private async requireOwnedChannel(channelId: string): Promise<void> {
    const channel = await this.repository.findChannelOwnership(channelId);
    if (!channel) throw new NotFoundException('Channel not found.');
    if (!channel.isOwn) {
      throw new ForbiddenException({
        label: 'Not Your Channel',
        detail:
          'This channel belongs to a wider scope. Switch to the workspace that owns it to change what it carries.',
      });
    }
  }

  // Loads a listing this workspace can see.
  private async requireReachable(id: string): Promise<CatalogListingRow> {
    const item = await this.repository.findByIdWithRefs(id);
    if (!item) throw new NotFoundException('Listing not found.');
    return item;
  }

  // Loads a listing by id, throwing if not found or owned by a wider scope.
  private async requireOwned(id: string): Promise<CatalogListingRow> {
    const item = await this.repository.findByIdWithRefs(id);
    if (!item) throw new NotFoundException('Listing not found.');
    if (!item.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Listing',
        detail: `"${item.code}" belongs to a wider scope. Switch to the workspace that owns it to change it.`,
      });
    }
    return item;
  }

  // Within one catalog a variant is listed either generally or by MRP slice — mixing the two leaves the same stock
  // reachable under two listings with no principled way to choose
  private async assertListingShape(
    catalogId: string,
    offeringVariantId: string,
    inventoryItemMrpId: string | null,
  ): Promise<void> {
    const siblings = await this.repository.findSiblingListings(catalogId, offeringVariantId);
    this.assertShapeAgainst(
      siblings.map((sibling) => sibling.inventoryItemMrpId),
      inventoryItemMrpId,
      'This variant',
    );
  }

  // The same rule stated against MRP keys already taken, so a batch can judge its own rows alongside the stored ones
  private assertShapeAgainst(taken: (string | null)[], inventoryItemMrpId: string | null, subject: string): void {
    if (taken.length === 0) return;

    const hasGeneral = taken.includes(null);
    if (inventoryItemMrpId === null) {
      throw new ConflictException({
        label: 'Already Listed',
        detail: hasGeneral
          ? `${subject} is already listed in this catalog.`
          : `${subject} is already listed by MRP here. Remove those listings before listing it generally.`,
      });
    }
    if (hasGeneral) {
      throw new ConflictException({
        label: 'Already Listed',
        detail: `${subject} is already listed generally here. Remove that listing before listing it by MRP.`,
      });
    }
    if (taken.includes(inventoryItemMrpId)) {
      throw new ConflictException({
        label: 'Already Listed',
        detail: `${subject} is already listed at that MRP in this catalog.`,
      });
    }
  }

  // A keyed listing may never be priced above the ceiling printed on the pack it covers
  private async assertWithinMrp(
    inventoryItemMrpId: string | null,
    amount: bigint,
    currencyCode: string,
  ): Promise<void> {
    if (!inventoryItemMrpId) return;
    const mrp = await this.repository.findMrpById(inventoryItemMrpId);
    this.assertPriceWithin(mrp, inventoryItemMrpId, amount, currencyCode, 'This listing');
  }

  // The ceiling check against an MRP already in hand, so a batch reads its MRPs once
  private assertPriceWithin(
    mrp: InventoryItemMrp | undefined,
    inventoryItemMrpId: string | null,
    amount: bigint,
    currencyCode: string,
    subject: string,
  ): void {
    if (!inventoryItemMrpId) return;
    if (!mrp) throw new NotFoundException('MRP not found.');
    if (mrp.currencyCode !== currencyCode) {
      throw new ConflictException({
        label: 'Currency Mismatch',
        detail: `${subject} is keyed to an MRP in ${mrp.currencyCode}. Price it in ${mrp.currencyCode}.`,
      });
    }
    if (amount > mrp.amount) {
      throw new ConflictException({
        label: 'Above MRP',
        detail: `A pack printed ${minorToMajor(mrp.amount, mrp.currencyCode as CurrencyCode)} cannot be sold above that price.`,
      });
    }
  }

  private async requireCatalog(catalogId: string) {
    const catalog = await this.catalogsRepository.findById(catalogId);
    if (!catalog) throw new NotFoundException('Catalog not found.');
    return catalog;
  }
}
