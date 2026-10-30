import type { InventoryItemMrpResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class LeInventoryItemsGatewayService {
  private readonly logger = new Logger(LeInventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns the organization's master items for the read-only legal-entity table
  async findForTable(userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('le.inventoryItems.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-le-inventory-items',
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`le.inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'le.inventoryItems.findById', { id });
  }

  findMrp(inventoryItemId: string): Promise<InventoryItemMrpResponseDto[]> {
    this.logger.log(`le.inventoryItems.mrp.table — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'le.inventoryItems.mrp.table', { inventoryItemId });
  }

  async findSuppliersTable(inventoryItemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`le.inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-le-inventory-item-${inventoryItemId}-suppliers`,
    );
    const { result, count } = await this.nats.send<{ result: InventoryItemSupplierResponseDto[]; count: number }>(
      'commerce',
      'le.inventoryItems.suppliers.table',
      { inventoryItemId, ...state },
    );
    return { result, count, state, activeViewId };
  }
}
