import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, TableViewState } from '@vritti/api-sdk/database';
import { InventoryItemsQuantsService } from './services/inventory-items-quants.service';

@Controller()
export class InventoryItemsQuantsController {
  private readonly logger = new Logger(InventoryItemsQuantsController.name);

  constructor(
    private readonly service: InventoryItemQuantsService,
    private readonly itemsQuantsService: InventoryItemsQuantsService,
  ) {}

  @MessagePattern({ cmd: 'site.inventoryItems.quantsTable' })
  async quantsTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`inventoryItems.quantsTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsQuantsService.findForTable(data.inventoryItemId, data);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.quantsFeed' })
  async quantsFeed(@Payload() data: { inventoryItemId: string; limit: number; cursor?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemQuantDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.quantsFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.itemsQuantsService.findFeed(data.inventoryItemId, data.limit, data.cursor);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.findQuantById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemQuantDto> {
    this.logger.log(`inventoryItems.findQuantById — id: ${data.id}`);
    return this.service.findQuantById(data.id);
  }

  @MessagePattern({ cmd: 'site.inventoryItems.selectQuants' })
  async select(@Payload() data: SelectOptionsQueryDto & { inventoryItemId?: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectQuants — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForSelect(data);
  }
}
