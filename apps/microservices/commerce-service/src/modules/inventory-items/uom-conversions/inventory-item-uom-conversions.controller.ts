import type { InventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/entity/inventory-item-uom-conversion.dto';
import { InventoryItemUomConversionsService } from '@domain/inventory-item-uom-conversions/services/inventory-item-uom-conversions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type CreateResponseDto, RpcBuId, type SuccessResponseDto, type TableViewState } from '@vritti/api-sdk';
import type { CreateInventoryItemUomConversionDto } from './dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemUomConversionDto } from './dto/request/update-inventory-item-uom-conversion.dto';

@Controller()
export class InventoryItemUomConversionsController {
  private readonly logger = new Logger(InventoryItemUomConversionsController.name);

  constructor(private readonly service: InventoryItemUomConversionsService) {}

  // Returns paginated UOM conversion overrides for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.uomConversions.table' })
  async table(
    @Payload() data: { itemId: string } & TableViewState,
    @RpcBuId() buId: string,
  ): Promise<{ result: InventoryItemUomConversionDto[]; count: number }> {
    const { itemId, ...state } = data;
    this.logger.log(`inventoryItems.uomConversions.table — itemId: ${itemId}`);
    return this.service.findForTable(itemId, state, buId);
  }

  // Creates a per-item UOM conversion override
  @MessagePattern({ cmd: 'inventoryItems.uomConversions.create' })
  async create(
    @Payload() data: { itemId: string } & CreateInventoryItemUomConversionDto,
    @RpcBuId() buId: string,
  ): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    const { itemId, ...dto } = data;
    this.logger.log(`inventoryItems.uomConversions.create — itemId: ${itemId}, uomId: ${dto.uomId}`);
    return this.service.create(itemId, dto, buId);
  }

  // Updates the conversion factor of an existing UOM override
  @MessagePattern({ cmd: 'inventoryItems.uomConversions.update' })
  async update(
    @Payload() data: { id: string } & UpdateInventoryItemUomConversionDto,
    @RpcBuId() buId: string,
  ): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    this.logger.log(`inventoryItems.uomConversions.update — id: ${id}`);
    return this.service.update(id, dto, buId);
  }

  // Deletes a UOM conversion override
  @MessagePattern({ cmd: 'inventoryItems.uomConversions.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.uomConversions.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
