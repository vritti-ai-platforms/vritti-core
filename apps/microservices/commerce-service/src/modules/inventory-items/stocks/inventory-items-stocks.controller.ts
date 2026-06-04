import type { LocationStockDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryItemsStocksService } from './services/inventory-items-stocks.service';

@Controller()
export class InventoryItemsStocksController {
  private readonly logger = new Logger(InventoryItemsStocksController.name);

  constructor(private readonly service: InventoryItemsStocksService) {}

  @MessagePattern({ cmd: 'inventoryItems.stocks' })
  async stocks(@Payload() data: { inventoryItemId: string }): Promise<LocationStockDto[]> {
    this.logger.log(`inventoryItems.stocks — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findStocks(data.inventoryItemId);
  }
}
