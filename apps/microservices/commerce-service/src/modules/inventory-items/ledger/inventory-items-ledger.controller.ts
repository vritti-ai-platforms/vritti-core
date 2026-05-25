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
  async ledger(@Payload() data: { inventoryItemId: string }): Promise<InventoryItemLedgerDto[]> {
    this.logger.log(`inventoryItems.ledger — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findByInventoryItemId(data.inventoryItemId);
  }

  // Returns paginated ledger entries for an inventory item data table
  @MessagePattern({ cmd: 'inventoryItems.ledgerTable' })
  async ledgerTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLedgerDto[]; count: number }> {
    this.logger.log(`inventoryItems.ledgerTable — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findForTable(data.inventoryItemId, data);
  }
}
