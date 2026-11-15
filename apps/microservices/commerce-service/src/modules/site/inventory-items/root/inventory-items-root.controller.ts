import { SetStockLevelsDto } from '@domain/inventory-item-site-stock-levels/dto/request/set-stock-levels.dto';
import { UpdateStockLevelsDto } from '@domain/inventory-item-site-stock-levels/dto/request/update-stock-levels.dto';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import type { SiteStockTableItemDto } from '@domain/inventory-items/dto/entity/scoped-inventory-item.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import { RpcLeCurrencyCode, RpcSiteId } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { InventoryItemSiteStockLevel } from '@/db/schema';
import { SiteInventoryItemsService } from './services/inventory-items-root.service';

@Controller()
export class InventoryItemsRootController {
  private readonly logger = new Logger(InventoryItemsRootController.name);

  constructor(
    private readonly service: InventoryItemsDomainService,
    private readonly rootService: SiteInventoryItemsService,
  ) {}

  // Updates an item's stock levels at the current site
  @MessagePattern({ cmd: 'site.inventoryItems.stockLevels.update' })
  async updateStockLevels(
    @Payload() dto: UpdateStockLevelsDto,
    @RpcSiteId() siteId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.stockLevels.update — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.updateStockLevels(siteId, dto);
  }

  // Sets a master item's stock levels at the current site
  @MessagePattern({ cmd: 'site.inventoryItems.stockLevels.create' })
  async setStockLevels(
    @Payload() dto: SetStockLevelsDto,
    @RpcSiteId() siteId: string,
  ): Promise<CreateResponseDto<InventoryItemSiteStockLevel>> {
    this.logger.log(`inventoryItems.stockLevels.create — inventoryItemId: ${dto.inventoryItemId}`);
    return this.rootService.setStockLevels(siteId, dto);
  }

  // Returns a single master inventory item by ID (shared detail)
  @MessagePattern({ cmd: 'site.inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Every master item, with its stock levels at this site and the stock it holds here, by location
  @MessagePattern({ cmd: 'site.inventoryItems.stockTable' })
  async stockTable(
    @Payload() state: TableState,
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<{ result: SiteStockTableItemDto[]; count: number }> {
    this.logger.log('inventoryItems.stockTable');
    return this.service.findForSiteStockTable(state, leCurrencyCode as CurrencyCode);
  }

  // Returns an item's stock levels at the current site, or null while none are set
  @MessagePattern({ cmd: 'site.inventoryItems.stockLevels.find' })
  async findStockLevels(@Payload() data: { inventoryItemId: string }): Promise<InventoryItemSiteStockLevel | null> {
    this.logger.log(`inventoryItems.stockLevels.find — inventoryItemId: ${data.inventoryItemId}`);
    return this.rootService.findStockLevels(data.inventoryItemId);
  }

  // Removes an item's stock levels at the current site
  @MessagePattern({ cmd: 'site.inventoryItems.stockLevels.delete' })
  async removeStockLevels(
    @Payload() data: { inventoryItemId: string },
    @RpcSiteId() siteId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.stockLevels.delete — inventoryItemId: ${data.inventoryItemId}`);
    return this.rootService.removeStockLevels(siteId, data.inventoryItemId);
  }
}
