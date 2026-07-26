import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AddInventoryItemMrpDto } from '@commerce/inventory-items/dto/request/add-inventory-item-mrp.dto';
import type { CreateInventoryItemDto } from '@commerce/inventory-items/dto/request/create-inventory-item.dto';
import type { CreateInventoryItemUomConversionDto } from '@commerce/inventory-items/dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemDto } from '@commerce/inventory-items/dto/request/update-inventory-item.dto';
import type { UpdateInventoryItemMrpDto } from '@commerce/inventory-items/dto/request/update-inventory-item-mrp.dto';
import type { UpdateInventoryItemUomConversionDto } from '@commerce/inventory-items/dto/request/update-inventory-item-uom-conversion.dto';
import type { InventoryItemMrpResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import type { InventoryItemUomConversionResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-uom-conversion-response.dto';

@Injectable()
export class InventoryItemsGatewayService {
  private readonly logger = new Logger(InventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated org-wide inventory items for the data table
  async findForTable(userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('org.inventoryItems.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-org-inventory-items',
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated inventory item options for select dropdowns
  async select(params: SelectOptionsQueryDto & { excludeOnSupplierId?: string }): Promise<SelectQueryResult> {
    this.logger.log('org.inventoryItems.select');
    return this.nats.send('commerce', 'org.inventoryItems.select', params);
  }

  // Creates a new org inventory item
  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log(`org.inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'org.inventoryItems.create', dto);
  }

  // Returns a single inventory item by ID
  async findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`org.inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.findById', { id });
  }

  // Updates an inventory item
  async update(id: string, dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.update — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.update', { id, ...dto });
  }

  // Deletes an inventory item
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.delete', { id });
  }

  // Returns paginated UOM conversion overrides for an inventory item
  async findUomConversionsForTable(inventoryItemId: string, userId: string) {
    this.logger.log(`org.inventoryItems.uom.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `org-inventory-item-${inventoryItemId}-uom-overrides`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemUomConversionResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.uom.table',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a per-item UOM conversion override
  async createUomConversion(
    inventoryItemId: string,
    dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`org.inventoryItems.uom.create — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.create', { inventoryItemId, ...dto });
  }

  // Updates a per-item UOM conversion override
  async updateUomConversion(
    conversionId: string,
    dto: UpdateInventoryItemUomConversionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.uom.update — id: ${conversionId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.update', { id: conversionId, ...dto });
  }

  // Deletes a per-item UOM conversion override
  async deleteUomConversion(conversionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.uom.delete — id: ${conversionId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.delete', { id: conversionId });
  }

  // Returns the suggested MRPs (one per currency) for an inventory item
  async findMrp(inventoryItemId: string): Promise<InventoryItemMrpResponseDto[]> {
    this.logger.log(`org.inventoryItems.mrp.table — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.table', { inventoryItemId });
  }

  // Adds a manual MRP for an inventory item
  async addMrp(inventoryItemId: string, dto: AddInventoryItemMrpDto): Promise<InventoryItemMrpResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.add — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.add', { inventoryItemId, ...dto });
  }

  // Updates a manual MRP for an inventory item
  async updateMrp(
    inventoryItemId: string,
    mrpId: string,
    dto: UpdateInventoryItemMrpDto,
  ): Promise<InventoryItemMrpResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.update — inventoryItemId: ${inventoryItemId}, id: ${mrpId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.update', { inventoryItemId, id: mrpId, ...dto });
  }

  // Deletes a manual MRP for an inventory item
  async deleteMrp(mrpId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.delete — id: ${mrpId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.delete', { id: mrpId });
  }

  // Returns supplier links for a given inventory item, table-shaped
  async findSuppliersTable(inventoryItemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`org.inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `org-inventory-item-${inventoryItemId}-suppliers`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemSupplierResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.suppliers.table',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }
}
