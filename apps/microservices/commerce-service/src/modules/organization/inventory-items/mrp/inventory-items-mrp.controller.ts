import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { InventoryItemMrpDto } from './dto/entity/inventory-item-mrp.dto';
import type { UpsertInventoryItemMrpDto } from './dto/request/upsert-inventory-item-mrp.dto';
import { InventoryItemsMrpService } from './services/inventory-items-mrp.service';

@Controller()
export class InventoryItemsMrpController {
  private readonly logger = new Logger(InventoryItemsMrpController.name);

  constructor(private readonly service: InventoryItemsMrpService) {}

  // Returns the suggested MRPs (one per currency) for an inventory item
  @MessagePattern({ cmd: 'org.inventoryItems.mrp.table' })
  async table(@Payload() data: { inventoryItemId: string }): Promise<InventoryItemMrpDto[]> {
    this.logger.log(`inventoryItems.mrp.table — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findByItem(data.inventoryItemId);
  }

  // Records the latest suggested MRP for an (item, currency)
  @MessagePattern({ cmd: 'org.inventoryItems.mrp.upsert' })
  async upsert(@Payload() dto: UpsertInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`inventoryItems.mrp.upsert — inventoryItemId: ${dto.inventoryItemId}`);
    return this.service.upsert(dto);
  }
}
