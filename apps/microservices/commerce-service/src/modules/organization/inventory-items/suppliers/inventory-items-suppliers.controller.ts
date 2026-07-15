import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import type { InventoryItemSupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class InventoryItemsSuppliersController {
  private readonly logger = new Logger(InventoryItemsSuppliersController.name);

  constructor(private readonly service: SupplierItemsService) {}

  // Read-only list of supplier_items (LE + currency filter applied by the caller) carrying this item
  @MessagePattern({ cmd: 'org.inventoryItems.suppliers.table' })
  async table(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    return this.service.findSuppliersForItem(inventoryItemId, state);
  }
}
