import type { InventoryItemSiteStockLevelDto } from '@domain/inventory-item-site-stock-levels/dto/entity/inventory-item-site-stock-level.dto';
import type { ItemStockBySiteDto } from '@domain/inventory-item-site-stock-levels/dto/entity/item-site-stock.dto';
import { CreateInventoryItemSiteStockLevelDto } from '@domain/inventory-item-site-stock-levels/dto/request/create-inventory-item-site-stock-level.dto';
import { UpdateInventoryItemSiteStockLevelDto } from '@domain/inventory-item-site-stock-levels/dto/request/update-inventory-item-site-stock-level.dto';
import { InventoryItemSiteStockLevelsDomainService } from '@domain/inventory-item-site-stock-levels/services/inventory-item-site-stock-levels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableFilters } from '@vritti/api-sdk/data-table';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import { RpcLeCurrencyCode } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeInventoryItemSiteStockLevelsController {
  private readonly logger = new Logger(LeInventoryItemSiteStockLevelsController.name);

  constructor(private readonly service: InventoryItemSiteStockLevelsDomainService) {}

  // The item's stock levels at the legal entity's sites that have them, with the stock each holds by location and
  // whether each passes the table's status filter; core pages the sites and attaches these rows
  @MessagePattern({ cmd: 'le.inventoryItems.siteStockLevels.bySite' })
  bySite(
    @Payload() data: { inventoryItemId: string; filters: TableFilters },
    @RpcLeCurrencyCode() leCurrencyCode: string,
  ): Promise<ItemStockBySiteDto> {
    this.logger.log(`le.inventoryItems.siteStockLevels.bySite — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findStockBySite(data.inventoryItemId, data.filters, leCurrencyCode as CurrencyCode);
  }

  // The legal entity's sites the item already has stock levels at
  @MessagePattern({ cmd: 'le.inventoryItems.siteStockLevels.siteIds' })
  siteIds(@Payload() data: { inventoryItemId: string }): Promise<string[]> {
    this.logger.log(`le.inventoryItems.siteStockLevels.siteIds — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findSiteIdsForItem(data.inventoryItemId);
  }

  // Sets the item's stock levels at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.inventoryItems.siteStockLevels.create' })
  create(
    @Payload() dto: CreateInventoryItemSiteStockLevelDto,
  ): Promise<CreateResponseDto<InventoryItemSiteStockLevelDto>> {
    this.logger.log(
      `le.inventoryItems.siteStockLevels.create — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`,
    );
    return this.service.create(dto);
  }

  // Updates the item's stock levels at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.inventoryItems.siteStockLevels.update' })
  update(@Payload() dto: UpdateInventoryItemSiteStockLevelDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.inventoryItems.siteStockLevels.update — inventoryItemId: ${dto.inventoryItemId}, siteId: ${dto.siteId}`,
    );
    return this.service.update(dto);
  }

  // Removes the item's stock levels at one of the legal entity's sites
  @MessagePattern({ cmd: 'le.inventoryItems.siteStockLevels.delete' })
  delete(@Payload() data: { inventoryItemId: string; siteId: string }): Promise<SuccessResponseDto> {
    this.logger.log(
      `le.inventoryItems.siteStockLevels.delete — inventoryItemId: ${data.inventoryItemId}, siteId: ${data.siteId}`,
    );
    return this.service.delete(data.inventoryItemId, data.siteId);
  }
}
