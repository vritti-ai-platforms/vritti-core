import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { asc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor, minorToMajor } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { catalogListings, offeringVariants } from '@/db/schema';
import {
  CatalogListingDto,
  CatalogListingMrpOptionDto,
  type CatalogListingRow,
} from '../dto/entity/catalog-listing.dto';
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

  // The MRP slices a variant can be listed at, for the add-listing picker Everything one storefront channel offers,
  // priced
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

  // A keyed listing may never be priced above the ceiling printed on the pack it covers
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
