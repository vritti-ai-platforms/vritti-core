import type { InventoryItemLedgerDto } from '@domain/inventory-item-ledger/dto/entity/inventory-item-ledger.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';
import { InventoryItemsLedgerService } from './services/inventory-items-ledger.service';

@Controller()
export class InventoryItemsLedgerController {
  private readonly logger = new Logger(InventoryItemsLedgerController.name);

  constructor(private readonly service: InventoryItemsLedgerService) {}

  // Returns paginated ledger entries for an inventory item data table
  @MessagePattern({ cmd: 'inventoryItems.ledgerTable' })
  async ledgerTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItems.ledgerTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForTable(data.inventoryItemId, data);
  }

  @MessagePattern({ cmd: 'inventoryItems.ledgerFeed' })
  async ledgerFeed(
    @Payload() data: { inventoryItemId: string; limit: number; cursor?: string },
  ): Promise<{
    edges: { cursor: string; node: InventoryItemLedgerDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.ledgerFeed — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findFeed(data.inventoryItemId, data.limit, data.cursor);
  }
}
