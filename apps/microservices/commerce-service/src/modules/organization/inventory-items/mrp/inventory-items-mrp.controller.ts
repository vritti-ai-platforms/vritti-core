import type { InventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/entity/inventory-item-mrp.dto';
import { AddInventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/request/add-inventory-item-mrp.dto';
import { UpdateInventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/request/update-inventory-item-mrp.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
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

  // Adds a new suggested MRP for an (item, uom, currency)
  @MessagePattern({ cmd: 'org.inventoryItems.mrp.add' })
  async add(@Payload() dto: AddInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`inventoryItems.mrp.add — inventoryItemId: ${dto.inventoryItemId}`);
    return this.service.add(dto);
  }

  // Updates an existing MRP row's amount by id
  @MessagePattern({ cmd: 'org.inventoryItems.mrp.update' })
  async update(@Payload() dto: UpdateInventoryItemMrpDto): Promise<InventoryItemMrpDto> {
    this.logger.log(`inventoryItems.mrp.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Deletes an MRP row by id
  @MessagePattern({ cmd: 'org.inventoryItems.mrp.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.mrp.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
