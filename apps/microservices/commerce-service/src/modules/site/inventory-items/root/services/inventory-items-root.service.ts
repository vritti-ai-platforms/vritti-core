import { InventoryItemSiteDto } from '@domain/inventory-item-sites/dto/entity/inventory-item-site.dto';
import type { BlockSiteItemDto } from '@domain/inventory-item-sites/dto/request/block-site-item.dto';
import type { ReplenishmentDto } from '@domain/inventory-item-sites/dto/request/replenishment.dto';
import type { SiteItemRefDto } from '@domain/inventory-item-sites/dto/request/site-item-ref.dto';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import type { SiteInventoryItemCountsDto } from '@domain/inventory-items/dto/entity/site-inventory-item-counts.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { toSiteStockDisplay } from '../dto/entity/site-stock-display.dto';
import type { SiteStockTableRowDto } from '../dto/entity/site-stock-table-row.dto';

@Injectable()
export class SiteInventoryItemsService {
  private readonly logger = new Logger(SiteInventoryItemsService.name);

  constructor(
    private readonly siteItemsService: InventoryItemSitesDomainService,
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Adds an item to the current site with how it is replenished here
  async addToSite(dto: ReplenishmentDto): Promise<CreateResponseDto<InventoryItemSiteDto>> {
    this.logger.log(`addToSite — inventoryItemId=${dto.inventoryItemId}`);
    const entity = await this.siteItemsService.create({ ...dto, siteId: undefined });
    return { success: true, message: 'Item added to this site.', data: InventoryItemSiteDto.from(entity) };
  }

  // Changes how the current site replenishes an item
  updateReplenishment(dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`updateReplenishment — inventoryItemId=${dto.inventoryItemId}`);
    return this.siteItemsService.update({ ...dto, siteId: undefined });
  }

  // Stops the current site buying an item, with why
  block(dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`block — inventoryItemId=${dto.inventoryItemId}`);
    return this.siteItemsService.block({ ...dto, siteId: undefined });
  }

  // Lets the current site buy an item again
  unblock(inventoryItemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`unblock — inventoryItemId=${inventoryItemId}`);
    return this.siteItemsService.unblock({ inventoryItemId });
  }

  // Returns a single master inventory item by ID (shared detail)
  findById(id: string): Promise<InventoryItemDto> {
    return this.inventoryItemsService.findById(id);
  }

  // Every master item with how the current site carries it and the stock it holds here by location, each primary-unit
  // quantity also expressed in the item's display unit
  async findForStockTable(
    state: TableState,
    leCurrencyCode: CurrencyCode,
  ): Promise<{ result: SiteStockTableRowDto[]; count: number }> {
    const { result, count } = await this.inventoryItemsService.findForSiteStockTable(state, leCurrencyCode);
    return {
      result: result.map(({ displayUnitRatios, ...row }) => ({
        ...row,
        display: toSiteStockDisplay(row, (qty) =>
          this.uomConversionsService.toDisplayUomQuantity(qty, displayUnitRatios),
        ),
      })),
      count,
    };
  }

  // Counts the rows each tab of the item's detail page lists at the current site
  findCounts(id: string): Promise<SiteInventoryItemCountsDto> {
    return this.inventoryItemsService.findSiteCounts(id);
  }

  // How the current site carries an item, or null while it does not; RLS narrows the item's rows to this site
  async findSiteItem(inventoryItemId: string): Promise<InventoryItemSiteDto | null> {
    const [siteItem] = await this.siteItemsService.findByItem(inventoryItemId);
    return siteItem ? InventoryItemSiteDto.from(siteItem) : null;
  }

  // Removes an item from the current site, refused while it is held or on an open purchase here
  removeFromSite(dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`removeFromSite — inventoryItemId=${dto.inventoryItemId}`);
    return this.siteItemsService.delete({ inventoryItemId: dto.inventoryItemId });
  }
}
