import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterOperators, FilterProcessor } from '@vritti/api-sdk/conditions';
import type { TableFilters } from '@vritti/api-sdk/data-table';
import { not } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { CurrencyAmountDto, type CurrencyCode } from '@vritti/api-sdk/money';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type InventoryItemSiteStockLevel, noStockLevelsMatches, siteStockStatusMatchesSql } from '@/db/schema';
import { InventoryItemSiteStockLevelDto } from '../dto/entity/inventory-item-site-stock-level.dto';
import type { ItemStockBySiteDto } from '../dto/entity/item-site-stock.dto';
import type { CreateInventoryItemSiteStockLevelDto } from '../dto/request/create-inventory-item-site-stock-level.dto';
import type { UpdateStockLevelsDto } from '../dto/request/update-stock-levels.dto';
import { InventoryItemSiteStockLevelsDomainRepository } from '../repositories/inventory-item-site-stock-levels.repository';

type StockSettings = { reorderPoint?: number; safetyStock?: number; maxStockLevel?: number };

@Injectable()
export class InventoryItemSiteStockLevelsDomainService {
  private readonly logger = new Logger(InventoryItemSiteStockLevelsDomainService.name);

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    stockStatus: {
      multiExpression: (values, operator) => {
        const matches = siteStockStatusMatchesSql(values);
        return operator === FilterOperators.IS_NOT_ANY_OF ? not(matches) : matches;
      },
      type: 'string',
    },
  };

  constructor(private readonly repository: InventoryItemSiteStockLevelsDomainRepository) {}

  // Sets the item's stock levels at one of the legal entity's sites
  async create(dto: CreateInventoryItemSiteStockLevelDto): Promise<CreateResponseDto<InventoryItemSiteStockLevelDto>> {
    const entity = await this.setStockLevels(dto.inventoryItemId, dto, dto.siteId);
    return {
      success: true,
      message: 'Stock levels set for the site.',
      data: InventoryItemSiteStockLevelDto.from(entity),
    };
  }

  // Updates the item's stock levels at a site
  async update(dto: UpdateStockLevelsDto, siteId?: string): Promise<SuccessResponseDto> {
    const existing = await this.requireStockLevels(dto.inventoryItemId, siteId);
    const changes = this.stockSettings(dto);
    this.assertStockLevels({
      reorderPoint: changes.reorderPoint ?? existing.reorderPoint,
      safetyStock: changes.safetyStock ?? existing.safetyStock,
      maxStockLevel: changes.maxStockLevel ?? existing.maxStockLevel,
    });
    await this.repository.update(existing.id, changes);
    this.logger.log(`Updated stock levels for item ${dto.inventoryItemId} at site ${existing.siteId}`);
    return { success: true, message: 'Stock levels updated.' };
  }

  // Sets the item's stock levels at a site, which lets the site buy and stock it; the request's legal entity stamps the row
  async setStockLevels(
    inventoryItemId: string,
    data: StockSettings = {},
    siteId?: string,
  ): Promise<InventoryItemSiteStockLevel> {
    const existing = await this.repository.findByCompositeKey(inventoryItemId, siteId);
    if (existing) throw new ConflictException('Stock levels are already set for this item at this site.');
    const settings = this.stockSettings(data);
    this.assertStockLevels({
      reorderPoint: settings.reorderPoint ?? 0,
      safetyStock: settings.safetyStock ?? 0,
      maxStockLevel: settings.maxStockLevel ?? 0,
    });
    const entity = await this.repository.create({ inventoryItemId, siteId, ...settings });
    this.logger.log(`Set stock levels for inventory item ${inventoryItemId} at site ${entity.siteId}`);
    return entity;
  }

  // Rejects items without stock levels at the site; nothing is bought, received or stocked there until they are set
  async ensureStockLevels(inventoryItemIds: string[], field: string, siteId?: string): Promise<void> {
    const missingNames = await this.repository.findNamesWithoutStockLevels(inventoryItemIds, siteId);
    if (missingNames.length === 0) return;
    const quotedNames = missingNames.map((name) => `"${name}"`).join(', ');
    throw new BadRequestException({
      label: 'No Stock Levels',
      detail: `Set stock levels for ${quotedNames} at this site before buying, receiving or stocking it here.`,
      errors: [{ field, message: 'No stock levels at this site' }],
    });
  }

  // The item's stock levels at each of the legal entity's sites that has them, with the stock held there by location,
  // valued in the legal entity's currency and marked with whether the row passes the status filter; also whether the
  // sites with no stock levels pass it, which core needs to page the legal entity's sites. RLS narrows the rows to the
  // legal entity's sites
  async findStockBySite(
    inventoryItemId: string,
    filters: TableFilters,
    leCurrencyCode: CurrencyCode,
  ): Promise<ItemStockBySiteDto> {
    const rows = await this.repository.findStockBySite(
      inventoryItemId,
      FilterProcessor.buildWhere(filters, InventoryItemSiteStockLevelsDomainService.FILTER_FIELD_MAP),
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
      sitesWithoutStockLevelsMatch: options.length === 0 || excludesOptions !== noStockLevelsMatches(options),
    };
  }

  // The sites the item already has stock levels at, which the set dialog's site picker leaves out
  async findSiteIdsForItem(inventoryItemId: string): Promise<string[]> {
    const rows = await this.repository.findByItem(inventoryItemId);
    return rows.map((row) => row.siteId);
  }

  // Returns every projection row for the current site
  findBySite(siteId: string): Promise<InventoryItemSiteStockLevel[]> {
    return this.repository.findBySite(siteId);
  }

  // Returns every projection row for a given item
  findByItem(inventoryItemId: string): Promise<InventoryItemSiteStockLevel[]> {
    return this.repository.findByItem(inventoryItemId);
  }

  // Removes the item's stock levels at a site, which stops the site buying it; refused while the site holds stock of it or
  // an open purchase there includes it
  async delete(inventoryItemId: string, siteId?: string): Promise<SuccessResponseDto> {
    const existing = await this.requireStockLevels(inventoryItemId, siteId);
    await this.assertNothingOpenAt(inventoryItemId, existing.siteId);
    await this.repository.delete(existing.id);
    this.logger.log(`Removed stock levels for inventory item ${inventoryItemId} at site ${existing.siteId}`);
    return { success: true, message: 'Stock levels removed for the site.' };
  }

  // Loads the item's stock levels at the site, or 404s when none are set there
  private async requireStockLevels(inventoryItemId: string, siteId?: string): Promise<InventoryItemSiteStockLevel> {
    const existing = await this.repository.findByCompositeKey(inventoryItemId, siteId);
    if (!existing) throw new NotFoundException('Stock levels are not set for this item at that site.');
    return existing;
  }

  // Picks the stock settings off a payload, leaving out the ones it does not set
  private stockSettings(data: StockSettings): StockSettings {
    return {
      reorderPoint: data.reorderPoint,
      safetyStock: data.safetyStock,
      maxStockLevel: data.maxStockLevel,
    };
  }

  // Rejects levels that do not stack: a max level above 0, the reorder point at most the max level and the safety stock
  // at most the reorder point
  private assertStockLevels(levels: { reorderPoint: number; safetyStock: number; maxStockLevel: number }): void {
    const errors: { field: string; message: string }[] = [];
    if (levels.maxStockLevel <= 0) {
      errors.push({ field: 'maxStockLevel', message: 'Must be above 0' });
    } else if (levels.reorderPoint > levels.maxStockLevel) {
      errors.push({ field: 'reorderPoint', message: `Must be at most the max level (${levels.maxStockLevel})` });
    }
    if (levels.safetyStock > levels.reorderPoint) {
      errors.push({ field: 'safetyStock', message: `Must be at most the reorder point (${levels.reorderPoint})` });
    }
    if (errors.length === 0) return;
    throw new BadRequestException({
      label: 'Stock Levels Out of Order',
      detail:
        'The max level must be above 0, the reorder point at most the max level and the safety stock at most the reorder point.',
      errors,
    });
  }

  // Refuses to remove the item's stock levels at a site that still holds stock of it or has open purchases including it
  private async assertNothingOpenAt(inventoryItemId: string, siteId: string): Promise<void> {
    const onHand = await this.repository.findOnHandAtSite(inventoryItemId, siteId);
    const openPurchaseNumbers = await this.repository.findOpenPurchaseNumbers(inventoryItemId, siteId);
    const blockers: string[] = [];
    if (onHand > 0) blockers.push(`The site still holds ${onHand} of it on hand.`);
    if (openPurchaseNumbers.length > 0) {
      const quotedNumbers = openPurchaseNumbers.map((number) => `"${number}"`).join(', ');
      blockers.push(`It is on ${pluralize('open purchase', openPurchaseNumbers.length)} ${quotedNumbers}.`);
    }
    if (blockers.length === 0) return;
    throw new ConflictException({ label: 'Item Still in Use at Site', detail: blockers.join(' ') });
  }
}
