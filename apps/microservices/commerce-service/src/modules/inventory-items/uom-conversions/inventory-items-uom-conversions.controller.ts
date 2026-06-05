import type { InventoryItemUomConversionDto } from '@domain/inventory-item-uom-conversions/dto/entity/inventory-item-uom-conversion.dto';
import { InventoryItemUomConversionsService } from '@domain/inventory-item-uom-conversions/services/inventory-item-uom-conversions.service';
import { UomRepository } from '@domain/uom/repositories/uom.repository';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type CreateResponseDto, NotFoundException, type SuccessResponseDto, type TableViewState } from '@vritti/api-sdk';
import { RpcBuId } from '@vritti/api-sdk/nats';
import type { CreateInventoryItemUomConversionDto } from './dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemUomConversionDto } from './dto/request/update-inventory-item-uom-conversion.dto';

@Controller()
export class InventoryItemsUomConversionsController {
  private readonly logger = new Logger(InventoryItemsUomConversionsController.name);

  constructor(
    private readonly service: InventoryItemUomConversionsService,
    private readonly uomRepository: UomRepository,
  ) {}

  // Returns paginated UOM conversion overrides for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.uomConversionsTable' })
  async table(
    @Payload() data: { inventoryItemId: string } & TableViewState,
    @RpcBuId() buId: string,
  ): Promise<{ result: InventoryItemUomConversionDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.uomConversionsTable — inventoryItemId: ${inventoryItemId}`);
    return this.service.findForTable(inventoryItemId, state, buId);
  }

  // Creates a per-item UOM conversion override
  @MessagePattern({ cmd: 'inventoryItems.addUomConversion' })
  async create(
    @Payload() data: { inventoryItemId: string } & CreateInventoryItemUomConversionDto,
    @RpcBuId() buId: string,
  ): Promise<CreateResponseDto<InventoryItemUomConversionDto>> {
    const { inventoryItemId, ...dto } = data;
    this.logger.log(`inventoryItems.addUomConversion — inventoryItemId: ${inventoryItemId}, uomId: ${dto.uomId}`);
    const uomEntity = await this.uomRepository.findById(dto.uomId);
    if (!uomEntity) throw new NotFoundException('Unit of measure not found.');
    return this.service.create(
      inventoryItemId,
      dto,
      { baseUnitId: uomEntity.baseUnitId, name: uomEntity.name, symbol: uomEntity.symbol },
      buId,
    );
  }

  // Updates the conversion factor of an existing UOM override
  @MessagePattern({ cmd: 'inventoryItems.updateUomConversion' })
  async update(
    @Payload() data: { id: string } & UpdateInventoryItemUomConversionDto,
    @RpcBuId() buId: string,
  ): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    this.logger.log(`inventoryItems.updateUomConversion — id: ${id}`);
    return this.service.update(id, dto, buId);
  }

  // Deletes a UOM conversion override
  @MessagePattern({ cmd: 'inventoryItems.removeUomConversion' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeUomConversion — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
