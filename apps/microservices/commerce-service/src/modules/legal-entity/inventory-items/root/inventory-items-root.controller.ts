import { InventoryItemMrpDto } from '@domain/inventory-item-mrps/dto/entity/inventory-item-mrp.dto';
import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { InventoryItemSupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';

@Controller()
export class LeInventoryItemsController {
  private readonly logger = new Logger(LeInventoryItemsController.name);

  constructor(
    private readonly service: InventoryItemsDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly mrpsService: InventoryItemMrpsDomainService,
  ) {}

  // The organization's master items, read-only from a legal entity
  @MessagePattern({ cmd: 'le.inventoryItems.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForOrgTable(state);
  }

  // One master item, read-only from a legal entity
  @MessagePattern({ cmd: 'le.inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // The legal entity's suppliers carrying the item; the session's legal entity scopes the suppliers
  @MessagePattern({ cmd: 'le.inventoryItems.suppliers.table' })
  async suppliersTable(
    @Payload() data: { inventoryItemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const { inventoryItemId, ...state } = data;
    this.logger.log(`inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    return this.supplierItemsService.findSuppliersForItem(inventoryItemId, null, state);
  }

  // The item's MRPs, read-only from a legal entity
  @MessagePattern({ cmd: 'le.inventoryItems.mrp.table' })
  async mrpTable(@Payload() data: { inventoryItemId: string }): Promise<InventoryItemMrpDto[]> {
    this.logger.log(`inventoryItems.mrp.table — inventoryItemId: ${data.inventoryItemId}`);
    const rows = await this.mrpsService.findByItem(data.inventoryItemId);
    return rows.map((row) => InventoryItemMrpDto.from(row));
  }
}
