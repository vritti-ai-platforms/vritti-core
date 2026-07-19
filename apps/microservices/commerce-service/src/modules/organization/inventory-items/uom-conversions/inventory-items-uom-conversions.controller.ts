import type { InventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/entity/inventory-item-uom-conversion.dto';
import { CreateInventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/request/create-inventory-item-uom-conversion.dto';
import { UpdateInventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/request/update-inventory-item-uom-conversion.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { InventoryItemsUomConversionsService } from './services/inventory-items-uom-conversions.service';

@Controller()
export class InventoryItemsUomConversionsController {
  private readonly logger = new Logger(InventoryItemsUomConversionsController.name);

  constructor(private readonly service: InventoryItemsUomConversionsService) {}

  // Returns paginated UOM conversion overrides for an inventory item
  @MessagePattern({ cmd: 'org.inventoryItems.uom.table' })
  async table(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemUomConversionDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.uom.table — inventoryItemId: ${inventoryItemId}`);
    return this.service.findForTable(inventoryItemId, state);
  }

  // Creates a per-item UOM conversion override
  @MessagePattern({ cmd: 'org.inventoryItems.uom.create' })
  async create(
    @Payload() data: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    this.logger.log(`inventoryItems.uom.create — inventoryItemId: ${data.inventoryItemId}, uomId: ${data.uomId}`);
    return this.service.create(data);
  }

  // Updates the conversion factor of an existing UOM override
  @MessagePattern({ cmd: 'org.inventoryItems.uom.update' })
  async update(@Payload() data: UpdateInventoryItemUomConversionDto): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.uom.update — id: ${data.id}`);
    return this.service.update(data);
  }

  // Deletes a UOM conversion override
  @MessagePattern({ cmd: 'org.inventoryItems.uom.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.uom.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
