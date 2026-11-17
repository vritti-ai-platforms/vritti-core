import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import type { TableFilters } from '@vritti/api-sdk/data-table';
import { not } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto, type CurrencyCode } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import {
  type InventoryItemSite,
  notAtSiteMatches,
  ReplenishmentMethodValues,
  SiteItemStatusValues,
  siteStockStatusMatchesSql,
} from '@/db/schema';
import type { ItemStockBySiteDto, SiteItemStockDto } from '../dto/entity/item-site-stock.dto';
import type { BlockSiteItemDto } from '../dto/request/block-site-item.dto';
import type { ReplenishmentDto } from '../dto/request/replenishment.dto';
import type { SetSupplierItemsRequiredDto } from '../dto/request/set-supplier-items-required.dto';
import type { SiteItemRefDto } from '../dto/request/site-item-ref.dto';
import { InventoryItemSitesDomainRepository } from '../repositories/inventory-item-sites.repository';

type Replenishment = Pick<InventoryItemSite, 'replenishment' | 'safetyStock' | 'reorderPoint' | 'maxStock'>;

@Injectable()
export class InventoryItemSitesDomainService {
  private readonly logger = new Logger(InventoryItemSitesDomainService.name);

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    stockStatus: {
      multiExpression: (values, operator) => {
        const matches = siteStockStatusMatchesSql(values);
        return operator === FilterOperators.IS_NOT_ANY_OF ? not(matches) : matches;
      },
      type: 'string',
    },
  };

  constructor(private readonly repository: InventoryItemSitesDomainRepository) {}

  // Adds the item to a site with how it is replenished there, which lets the site buy and stock it; the request's legal
  // entity stamps the row
  async create(dto: ReplenishmentDto): Promise<InventoryItemSite> {
    const existing = await this.repository.findByCompositeKey(dto.inventoryItemId, dto.siteId);
    if (existing) throw new ConflictException('The site already carries this item.');
    const allowsDecimal = await this.repository.findUnitAllowsDecimal(dto.inventoryItemId);
    const entity = await this.repository.create({
      inventoryItemId: dto.inventoryItemId,
      siteId: dto.siteId,
      ...this.replenishmentOf(dto, allowsDecimal),
    });
    this.logger.log(`Added inventory item ${dto.inventoryItemId} to site ${entity.siteId}`);
    return entity;
  }

  // Changes how a site replenishes the item: the method and, for a reorder point, its levels
  async update(dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findAtSiteOrThrow(dto.inventoryItemId, dto.siteId);
    const allowsDecimal = await this.repository.findUnitAllowsDecimal(dto.inventoryItemId);
    await this.repository.update(existing.id, this.replenishmentOf(dto, allowsDecimal));
    this.logger.log(`Updated replenishment of item ${dto.inventoryItemId} at site ${existing.siteId}`);
    return { success: true, message: 'Replenishment updated.' };
  }

  // Stops the site buying the item, with why; stock already on hand or on order still moves
  async block(dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findAtSiteOrThrow(dto.inventoryItemId, dto.siteId);
    if (existing.status === SiteItemStatusValues.BLOCKED) {
      throw new ConflictException({
        label: 'Already Blocked',
        detail: `Purchasing is blocked: ${existing.blockedReason}`,
      });
    }
    await this.repository.update(existing.id, {
      status: SiteItemStatusValues.BLOCKED,
      blockedReason: dto.reason.trim(),
      blockedAt: new Date(),
    });
    this.logger.log(`Blocked purchasing of item ${dto.inventoryItemId} at site ${existing.siteId}`);
    return { success: true, message: 'Purchasing blocked at the site.' };
  }

  // Lets the site buy the item again
  async unblock(dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findAtSiteOrThrow(dto.inventoryItemId, dto.siteId);
    if (existing.status === SiteItemStatusValues.ACTIVE) {
      throw new ConflictException({ label: 'Not Blocked', detail: 'Purchasing of this item is not blocked here.' });
    }
    await this.repository.update(existing.id, {
      status: SiteItemStatusValues.ACTIVE,
      blockedReason: null,
      blockedAt: null,
    });
    this.logger.log(`Unblocked purchasing of item ${dto.inventoryItemId} at site ${existing.siteId}`);
    return { success: true, message: 'Purchasing unblocked at the site.' };
  }

  // Makes buying the item at the site need the supplier's item set up there, or lets the site's own rule decide
  async setSupplierItemsRequired(dto: SetSupplierItemsRequiredDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findAtSiteOrThrow(dto.inventoryItemId, dto.siteId);
    await this.repository.update(existing.id, { supplierItemsRequired: dto.required });
    this.logger.log(
      `Set supplier items ${dto.required ? 'required' : 'optional'} for item ${dto.inventoryItemId} at site ${existing.siteId}`,
    );
    return {
      success: true,
      message: dto.required
        ? 'The site buys the item only from suppliers that have it set up there.'
        : "The site's own rule decides which suppliers it buys the item from.",
    };
  }

  // Every site of the legal entity that carries the item, with the stock held there by location, valued in the legal
  // entity's currency and marked with whether the row passes the status filter; also whether the sites that do not
  // carry it pass it, which core needs to page the legal entity's sites. RLS narrows the rows to the legal entity's sites
  async findStockBySite(
    inventoryItemId: string,
    filters: TableFilters,
    leCurrencyCode: CurrencyCode,
  ): Promise<ItemStockBySiteDto> {
    const rows = await this.repository.findStockBySite(
      inventoryItemId,
      FilterProcessor.buildWhere(filters, InventoryItemSitesDomainService.FILTER_FIELD_MAP),
    );
    const statusCondition = [...(filters.panel ?? []), ...(filters.context ?? [])].find(
      (condition) => condition.field === 'stockStatus',
    );
    const options = statusCondition ? [statusCondition.value].flat().map(String) : [];
    const excludesOptions =
      statusCondition?.operator === FilterOperators.IS_NOT_ANY_OF ||
      statusCondition?.operator === FilterOperators.NOT_EQUALS;
    return {
      rows: rows.map((row) => ({ ...row, stockValue: CurrencyAmountDto.from(row.stockValue, leCurrencyCode) })),
      sitesNotCarryingMatch: options.length === 0 || excludesOptions !== notAtSiteMatches(options),
    };
  }

  // How the site carries the item and the stock it holds there, valued in the legal entity's currency; null while the site
  // does not carry it
  async findStockAtSite(
    inventoryItemId: string,
    siteId: string,
    leCurrencyCode: CurrencyCode,
  ): Promise<SiteItemStockDto | null> {
    const row = await this.repository.findStockAtSite(inventoryItemId, siteId);
    return row ? { ...row, stockValue: CurrencyAmountDto.from(row.stockValue, leCurrencyCode) } : null;
  }

  // The sites that already carry the item, which the add dialog's site picker leaves out
  async findSiteIdsForItem(inventoryItemId: string): Promise<string[]> {
    const rows = await this.repository.findByItem(inventoryItemId);
    return rows.map((row) => row.siteId);
  }

  // Returns every item the site carries
  findBySite(siteId: string): Promise<InventoryItemSite[]> {
    return this.repository.findBySite(siteId);
  }

  // Returns every site carrying the item
  findByItem(inventoryItemId: string): Promise<InventoryItemSite[]> {
    return this.repository.findByItem(inventoryItemId);
  }

  // Works out what to store for a replenishment: a reorder point needs a reorder point above 0, a maximum at least that
  // and a safety stock at most the reorder point, each a whole number when the item's unit cannot be split; manual
  // replenishment keeps no levels
  replenishmentOf(dto: ReplenishmentDto, allowsDecimal: boolean): Replenishment {
    if (dto.replenishment === ReplenishmentMethodValues.MANUAL) {
      return { replenishment: dto.replenishment, safetyStock: null, reorderPoint: null, maxStock: null };
    }
    const { reorderPoint, maxStock } = dto;
    const safetyStock = dto.safetyStock ?? null;
    const errors: { field: string; message: string }[] = [];
    if (reorderPoint == null || reorderPoint <= 0) errors.push({ field: 'reorderPoint', message: 'Must be above 0' });
    if (maxStock == null) errors.push({ field: 'maxStock', message: 'Maximum stock is required' });
    else if (reorderPoint != null && maxStock < reorderPoint) {
      errors.push({ field: 'maxStock', message: `Must be at least the reorder point (${reorderPoint})` });
    }
    if (safetyStock != null && reorderPoint != null && safetyStock > reorderPoint) {
      errors.push({ field: 'safetyStock', message: `Must be at most the reorder point (${reorderPoint})` });
    }
    if (!allowsDecimal) {
      const levels = { safetyStock, reorderPoint, maxStock };
      for (const [field, level] of Object.entries(levels)) {
        if (level != null && !Number.isInteger(level)) errors.push({ field, message: 'Must be a whole number' });
      }
    }
    if (errors.length > 0 || reorderPoint == null || maxStock == null) {
      throw new BadRequestException({
        label: 'Invalid Stock Levels',
        detail:
          "A reorder point needs a reorder point above 0, a maximum stock at least the reorder point and a safety stock at most the reorder point, each a whole number when the item's unit cannot be split.",
        errors,
      });
    }
    return { replenishment: dto.replenishment, safetyStock, reorderPoint, maxStock };
  }

  // Removes the item from a site, which stops the site buying and stocking it; refused while anything could still bring
  // stock of it there: stock on hand, an open purchase, a draft stock adjustment or goods receipt, or a transfer still to
  // be received
  async delete(dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findAtSiteOrThrow(dto.inventoryItemId, dto.siteId);
    const usage = await this.repository.findUsage(existing);
    const blockers: string[] = [];
    if (usage.onHand > 0) blockers.push(`The site still holds ${usage.onHand} of it on hand.`);
    if (usage.openPurchaseNumbers.length > 0) {
      blockers.push(`It is on ${this.documentList('open purchase', usage.openPurchaseNumbers)}.`);
    }
    if (usage.draftAdjustmentCodes.length > 0) {
      blockers.push(`It is on ${this.documentList('draft stock adjustment', usage.draftAdjustmentCodes)}.`);
    }
    if (usage.draftReceiptNumbers.length > 0) {
      blockers.push(`It is on ${this.documentList('draft goods receipt', usage.draftReceiptNumbers)}.`);
    }
    if (usage.incomingTransferCount > 0) {
      blockers.push(
        `It has ${pluralize('stock transfer', usage.incomingTransferCount, true)} still to be received here.`,
      );
    }
    if (blockers.length > 0) {
      throw new ConflictException({ label: 'Item Still in Use at Site', detail: blockers.join(' ') });
    }
    await this.repository.delete(existing.id);
    this.logger.log(`Removed inventory item ${dto.inventoryItemId} from site ${existing.siteId}`);
    return { success: true, message: 'Item removed from the site.' };
  }

  // Names documents by kind and number, e.g. open purchases "PUR-1", "PUR-2"
  private documentList(kind: string, numbers: string[]): string {
    return `${pluralize(kind, numbers.length)} ${numbers.map((number) => `"${number}"`).join(', ')}`;
  }
}
