import type { InventoryItemLedgerDto } from '@domain/inventory-item-ledger/dto/entity/inventory-item-ledger.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk';
import { InventoryItemsLedgerService } from './services/inventory-items-ledger.service';

@Controller()
export class InventoryItemsLedgerController {
  private readonly logger = new Logger(InventoryItemsLedgerController.name);

  constructor(private readonly service: InventoryItemsLedgerService) {}

  // Returns all ledger entries for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.ledger' })
  async ledger(@Payload() data: { itemId: string }): Promise<InventoryItemLedgerDto[]> {
    this.logger.log(`inventoryItems.ledger — itemId: ${data.itemId}`);
    return this.service.findByItemId(data.itemId);
  }

  // Returns paginated ledger entries for an inventory item data table
  @MessagePattern({ cmd: 'inventoryItems.ledgerTable' })
  async ledgerTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItems.ledgerTable — itemId: ${data.itemId}`);
    return this.service.findForTable(data.itemId, data);
  }
}
