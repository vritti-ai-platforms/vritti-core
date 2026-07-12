import type { LocationStockDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryItemsStocksService } from './services/inventory-items-stocks.service';

@Controller()
export class InventoryItemsStocksController {
  private readonly logger = new Logger(InventoryItemsStocksController.name);

  constructor(private readonly service: InventoryItemsStocksService) {}

  @MessagePattern({ cmd: 'site.inventoryItems.stocks' })
  async stocks(@Payload() data: { inventoryItemId: string }): Promise<LocationStockDto[]> {
    this.logger.log(`inventoryItems.stocks — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findStocks(data.inventoryItemId);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.stocksFeed' })
  async stocksFeed(@Payload() data: { inventoryItemId: string; limit: number; cursor?: string }): Promise<{
    edges: { cursor: string; node: LocationStockDto & { id: string } }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.stocksFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findStocksFeed(data.inventoryItemId, data.limit, data.cursor);
  }
}
