import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import type { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
import { InventoryItemsRootService } from './services/inventory-items-root.service';

@Controller()
export class InventoryItemsRootController {
  private readonly logger = new Logger(InventoryItemsRootController.name);

  constructor(
    private readonly service: InventoryItemsService,
    private readonly rootService: InventoryItemsRootService,
  ) {}

  @MessagePattern({ cmd: 'inventoryItems.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'inventoryItems.select' })
  async select(@Payload() data: SelectOptionsQueryDto & { excludeForSupplierId?: string }): Promise<SelectQueryResult> {
    const { excludeForSupplierId, ...query } = data;
    this.logger.log('inventoryItems.select');
    return this.service.findForSelect(query, { excludeForSupplierId });
  }

  @MessagePattern({ cmd: 'inventoryItems.selectBySupplier' })
  async selectBySupplier(
    @Payload() data: SelectOptionsQueryDto & { supplierId?: string; purchaseOrderId?: string },
  ): Promise<SelectQueryResult> {
    const { supplierId, purchaseOrderId, ...query } = data;
    this.logger.log(`inventoryItems.selectBySupplier — supplierId: ${supplierId ?? 'all'}`);
    return this.service.findForSelectBySupplier(supplierId, query, { purchaseOrderId });
  }

  @MessagePattern({ cmd: 'inventoryItems.selectByPurchaseOrder' })
  async selectByPurchaseOrder(@Payload() data: SelectOptionsQueryDto & { poId: string }): Promise<SelectQueryResult> {
    const { poId, ...query } = data;
    this.logger.log(`inventoryItems.selectByPurchaseOrder — poId: ${poId}`);
    return this.service.findForSelectByPurchaseOrder(poId, query);
  }

  @MessagePattern({ cmd: 'inventoryItems.create' })
  async create(@Payload() dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.rootService.create(dto);
  }

  @MessagePattern({ cmd: 'inventoryItems.allowedUomIds' })
  async allowedUomIds(@Payload() data: { id: string }): Promise<string[]> {
    this.logger.log(`inventoryItems.allowedUomIds — id: ${data.id}`);
    const { allowedUomIds } = await this.service.findAllowedUomIds(data.id);
    return allowedUomIds;
  }

  @MessagePattern({ cmd: 'inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'inventoryItems.update' })
  async update(@Payload() data: { id: string } & UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`inventoryItems.update — id: ${id}`);
    return this.rootService.update(id, updateData);
  }

  @MessagePattern({ cmd: 'inventoryItems.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
