import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { InventoryItemQuantWithDisplayDto } from './dto/entity/inventory-item-quant-with-display.dto';
import { InventoryItemsQuantsService } from './services/inventory-items-quants.service';

@Controller()
export class InventoryItemsQuantsController {
  private readonly logger = new Logger(InventoryItemsQuantsController.name);

  constructor(private readonly itemsQuantsService: InventoryItemsQuantsService) {}

  @MessagePattern({ cmd: 'site.inventoryItems.findQuantById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemQuantWithDisplayDto> {
    this.logger.log(`inventoryItems.findQuantById — id: ${data.id}`);
    return this.itemsQuantsService.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.quantsTable' })
  async quantsTable(
    @Payload() data: { inventoryItemId: string } & TableState,
  ): Promise<{ result: InventoryItemQuantWithDisplayDto[]; count: number }> {
    this.logger.log(`inventoryItems.quantsTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsQuantsService.findForTable(data.inventoryItemId, data);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.quantsFeed' })
  async quantsFeed(@Payload() data: { inventoryItemId: string; limit: number; cursor?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemQuantWithDisplayDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.quantsFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsQuantsService.findFeed(data.inventoryItemId, data.limit, data.cursor);
  }
}
