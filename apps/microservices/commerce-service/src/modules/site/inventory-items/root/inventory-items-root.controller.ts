import type { InventoryItemSiteDto } from '@domain/inventory-item-sites/dto/entity/inventory-item-site.dto';
import { BlockSiteItemDto } from '@domain/inventory-item-sites/dto/request/block-site-item.dto';
import { BulkBlockSiteItemsDto } from '@domain/inventory-item-sites/dto/request/bulk-block-site-items.dto';
import { BulkSiteItemsDto } from '@domain/inventory-item-sites/dto/request/bulk-site-items.dto';
import { ReplenishmentDto } from '@domain/inventory-item-sites/dto/request/replenishment.dto';
import { SiteItemRefDto } from '@domain/inventory-item-sites/dto/request/site-item-ref.dto';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import type { SiteInventoryItemCountsDto } from '@domain/inventory-items/dto/entity/site-inventory-item-counts.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SiteStockTableRowDto } from './dto/entity/site-stock-table-row.dto';
import { SiteInventoryItemsService } from './services/inventory-items-root.service';

@Controller()
export class InventoryItemsRootController {
  private readonly logger = new Logger(InventoryItemsRootController.name);

  constructor(private readonly rootService: SiteInventoryItemsService) {}

  // Adds an item to the current site with how it is replenished here
  @MessagePattern({ cmd: 'site.inventoryItems.setup.create' })
  addToSite(@Payload() dto: ReplenishmentDto): Promise<CreateResponseDto<InventoryItemSiteDto>> {
    this.logger.log(`site.inventoryItems.setup.create — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.addToSite(dto);
  }

  // Adds the selected items to the current site, each restocked manually until its levels are set; refused while it carries any
  @MessagePattern({ cmd: 'site.inventoryItems.setup.bulkCreate' })
  bulkAddToSite(@Payload() dto: BulkSiteItemsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.bulkCreate — ${dto.inventoryItemIds.length} selected`);
    return this.rootService.bulkAddToSite(dto);
  }

  // Changes how the current site replenishes an item
  @MessagePattern({ cmd: 'site.inventoryItems.setup.update' })
  updateReplenishment(@Payload() dto: ReplenishmentDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.update — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.updateReplenishment(dto);
  }

  // Stops the current site buying an item, with why
  @MessagePattern({ cmd: 'site.inventoryItems.setup.block' })
  block(@Payload() dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.block — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.block(dto);
  }

  // Stops the current site buying the selected items, with one reason for all
  @MessagePattern({ cmd: 'site.inventoryItems.setup.bulkBlock' })
  bulkBlock(@Payload() dto: BulkBlockSiteItemsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.bulkBlock — ${dto.inventoryItemIds.length} selected`);
    return this.rootService.bulkBlock(dto);
  }

  // Lets the current site buy an item again
  @MessagePattern({ cmd: 'site.inventoryItems.setup.unblock' })
  unblock(@Payload() dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.unblock — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.unblock(dto.inventoryItemId);
  }

  // Lets the current site buy the selected items again where it has blocked them
  @MessagePattern({ cmd: 'site.inventoryItems.setup.bulkUnblock' })
  bulkUnblock(@Payload() dto: BulkSiteItemsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.bulkUnblock — ${dto.inventoryItemIds.length} selected`);
    return this.rootService.bulkUnblock(dto);
  }

  // Returns a single master inventory item by ID (shared detail)
  @MessagePattern({ cmd: 'site.inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.rootService.findById(data.id);
  }

  // Every master item, with how this site carries it and the stock it holds here, by location
  @MessagePattern({ cmd: 'site.inventoryItems.stockTable' })
  async stockTable(
    @Payload() state: TableState,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<{ result: SiteStockTableRowDto[]; count: number }> {
    this.logger.log('inventoryItems.stockTable');
    return this.rootService.findForStockTable(state, leCurrencyCode as CurrencyCode);
  }

  // Counts the rows each tab of the item's detail page lists at the current site
  @MessagePattern({ cmd: 'site.inventoryItems.findCounts' })
  findCounts(@Payload() data: { id: string }): Promise<SiteInventoryItemCountsDto> {
    this.logger.log(`site.inventoryItems.findCounts — id: ${data.id}`);
    return this.rootService.findCounts(data.id);
  }

  // Returns how the current site carries an item, or null while it does not
  @MessagePattern({ cmd: 'site.inventoryItems.setup.find' })
  findSiteItem(@Payload() dto: SiteItemRefDto): Promise<InventoryItemSiteDto | null> {
    this.logger.log(`site.inventoryItems.setup.find — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.findSiteItem(dto.inventoryItemId);
  }

  // Removes an item from the current site
  @MessagePattern({ cmd: 'site.inventoryItems.setup.delete' })
  removeFromSite(@Payload() dto: SiteItemRefDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.setup.delete — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.removeFromSite(dto);
  }
}
