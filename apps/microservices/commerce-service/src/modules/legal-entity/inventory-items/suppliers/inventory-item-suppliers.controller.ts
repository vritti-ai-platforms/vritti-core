import { AddSupplierItemDto } from '@domain/supplier-items/dto/request/add-supplier-item.dto';
import type { InventoryItemSupplierDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import { LeInventoryItemSuppliersService } from './services/inventory-item-suppliers.service';

@Controller()
export class LeInventoryItemSuppliersController {
  private readonly logger = new Logger(LeInventoryItemSuppliersController.name);

  constructor(private readonly service: LeInventoryItemSuppliersService) {}

  // Sets the item up as one of a supplier's items, in a unit and at the enrolled sites that buy it from them
  @MessagePattern({ cmd: 'le.inventoryItems.suppliers.create' })
  create(@Payload() dto: AddSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    this.logger.log(
      `le.inventoryItems.suppliers.create — inventoryItemId: ${dto.inventoryItemId}, supplierId: ${dto.supplierId}`,
    );
    return this.service.create(dto);
  }

  // The legal entity's suppliers carrying the item, narrowed to one site's when the table's context picks one; the
  // session's legal entity scopes the suppliers
  @MessagePattern({ cmd: 'le.inventoryItems.suppliers.table' })
  findForTable(
    @Payload() data: { inventoryItemId: string } & TableState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`le.inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    return this.service.findForTable(inventoryItemId, state);
  }
}
