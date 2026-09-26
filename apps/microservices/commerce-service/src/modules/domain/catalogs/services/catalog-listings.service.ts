import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
import { catalogListings, offeringVariants } from '@/db/schema';
import { CatalogListingDto, CatalogListingMrpOptionDto } from '../dto/entity/catalog-listing.dto';
import type { AddCatalogListingDto } from '../dto/request/add-catalog-listing.dto';
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

  // Returns one page of a catalog's listings, each with its prices
  async findForTable(
    catalogId: string,
    state: TableViewState,
  ): Promise<{ result: CatalogListingDto[]; count: number }> {
    await this.requireCatalog(catalogId);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result: rows, count } = await this.repository.findForTable({
      where: eq(catalogListings.catalogId, catalogId) as SQL,
      orderBy: [asc(offeringVariants.sku)],
      limit,
      offset,
    });
    const ids = rows.map((row) => row.id);
    const prices = await this.repository.findPrices(ids);
    const exclusions = await this.repository.findExclusions(ids);
    return {
      result: rows.map((row) =>
        CatalogListingDto.from(
          row,
          prices.filter((price) => price.catalogListingId === row.id),
          exclusions.filter((x) => x.catalogListingId === row.id).map((x) => x.catalogChannelId),
        ),
      ),
      count,
    };
  }

  // The MRP slices a variant can be listed at, for the add-listing picker
  /**
   * Everything one storefront channel sells, priced.
   *
   * The list a provisioned website picks from when somebody files a product in its CMS — so it is
   * the sellable set, not the catalogue: delisted rows and anything excluded from this channel are
   * dropped, because offering one would let an editor key a page to something the shop cannot sell.
   */
  async findSellableForChannel(
    channelId: string,
    catalogId: string,
    siteId?: string | null,
  ): Promise<CatalogListingDto[]> {
    // A listing in the catalogue is sellable. Delisting removes the row rather than flagging it,
    // so there is nothing left to filter on here.
    const active = await this.repository.findByCatalog(catalogId);
    if (active.length === 0) return [];

    const ids = active.map((row) => row.id);
    const [prices, exclusions] = await Promise.all([
      this.repository.findPrices(ids),
      this.repository.findExclusions(ids),
    ]);

    const hiddenHere = new Set(
      exclusions.filter((row) => row.catalogChannelId === channelId).map((row) => row.catalogListingId),
    );

    return active
      .filter((row) => !hiddenHere.has(row.id))
      .map((row) => {
        const forListing = prices.filter((price) => price.catalogListingId === row.id);
        // A site's own price wins; the null-site row is the organization-wide fallback. Both are
        // returned when neither matches, so a caller can still see what exists.
        const scoped = siteId
          ? forListing.filter((price) => price.siteId === siteId || price.siteId === null)
          : forListing.filter((price) => price.siteId === null);
        const best = scoped.filter((price) => price.siteId === siteId);
        return CatalogListingDto.from(row, best.length > 0 ? best : scoped);
      });
  }

  async findMrpOptions(offeringVariantId: string): Promise<CatalogListingMrpOptionDto[]> {
    const rows = await this.repository.findMrpOptionsForVariant(offeringVariantId);
    return rows.map((row) => CatalogListingMrpOptionDto.from(row));
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
        await this.repository.upsertPrice(item.id, data.price.currency, amount, data.siteId ?? null);
      }
      return item;
    });

    this.logger.log(`Listed variant ${data.offeringVariantId} in catalog ${catalog.name} (mrp: ${mrpId ?? 'any'})`);
    const row = await this.repository.findByIdWithRefs(created.id);
    const prices = await this.repository.findPrices([created.id]);
    return {
      success: true,
      message: row?.sku ? `"${row.sku}" listed.` : 'Listed.',
      data: CatalogListingDto.from(row as NonNullable<typeof row>, prices),
    };
  }

  // Sets the price for a (listing, currency, site) slot; refused above the listing's printed MRP
  async setPrice(data: SetCatalogListingPriceDto): Promise<SuccessResponseDto> {
    const item = await this.repository.findById(data.catalogListingId);
    if (!item) throw new NotFoundException('Listing not found.');
    const amount = majorToMinor(data.price.value, data.price.currency as CurrencyCode, 'price');
    await this.assertWithinMrp(item.inventoryItemMrpId, amount, data.price.currency);
    await this.repository.upsertPrice(item.id, data.price.currency, amount, data.siteId ?? null);
    return { success: true, message: 'Price updated.' };
  }

  // Visible everywhere by default, so hiding writes one exclusion and showing removes it
  async setChannelVisibility(id: string, catalogChannelId: string, visible: boolean): Promise<SuccessResponseDto> {
    const listing = await this.repository.findById(id);
    if (!listing) throw new NotFoundException('Listing not found.');
    if (visible) await this.repository.removeExclusion(id, catalogChannelId);
    else await this.repository.addExclusion(id, catalogChannelId);
    return { success: true, message: visible ? 'Listing shown on this channel.' : 'Listing hidden on this channel.' };
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException('Listing not found.');
    await this.repository.deleteListing(id);
    return { success: true, message: 'Listing removed.' };
  }

  // Within one catalog a variant is listed either generally or by MRP slice — mixing the two
  // leaves the same stock reachable under two listings with no principled way to choose
  private async assertListingShape(
    catalogId: string,
    offeringVariantId: string,
    inventoryItemMrpId: string | null,
  ): Promise<void> {
    const siblings = await this.repository.findSiblingListings(catalogId, offeringVariantId);
    if (siblings.length === 0) return;

    const hasGeneral = siblings.some((sibling) => sibling.inventoryItemMrpId === null);
    if (inventoryItemMrpId === null && siblings.length > 0) {
      throw new ConflictException({
        label: 'Already Listed',
        detail: hasGeneral
          ? 'This variant is already listed in this catalog.'
          : 'This variant is already listed by MRP here. Remove those listings before listing it generally.',
      });
    }
    if (hasGeneral) {
      throw new ConflictException({
        label: 'Already Listed',
        detail: 'This variant is already listed generally here. Remove that listing before listing it by MRP.',
      });
    }
    if (siblings.some((sibling) => sibling.inventoryItemMrpId === inventoryItemMrpId)) {
      throw new ConflictException({
        label: 'Already Listed',
        detail: 'This variant is already listed at that MRP in this catalog.',
      });
    }
  }

  // A keyed listing may never be priced above the ceiling printed on the pack it sells
  private async assertWithinMrp(
    inventoryItemMrpId: string | null,
    amount: bigint,
    currencyCode: string,
  ): Promise<void> {
    if (!inventoryItemMrpId) return;
    const mrp = await this.repository.findMrpById(inventoryItemMrpId);
    if (!mrp) throw new NotFoundException('MRP not found.');
    if (mrp.currencyCode !== currencyCode) {
      throw new ConflictException({
        label: 'Currency Mismatch',
        detail: `This listing is keyed to an MRP in ${mrp.currencyCode}. Price it in ${mrp.currencyCode}.`,
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
