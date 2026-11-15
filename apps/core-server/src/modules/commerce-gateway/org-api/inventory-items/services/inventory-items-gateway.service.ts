import type { AddInventoryItemMrpDto } from '@commerce/inventory-items/dto/request/add-inventory-item-mrp.dto';
import type { CreateInventoryItemDto } from '@commerce/inventory-items/dto/request/create-inventory-item.dto';
import type { CreateInventoryItemStorageTypeDto } from '@commerce/inventory-items/dto/request/create-inventory-item-storage-type.dto';
import type { CreateInventoryItemUomConversionDto } from '@commerce/inventory-items/dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemDto } from '@commerce/inventory-items/dto/request/update-inventory-item.dto';
import type { UpdateInventoryItemMrpDto } from '@commerce/inventory-items/dto/request/update-inventory-item-mrp.dto';
import type { UpdateInventoryItemStorageTypeDto } from '@commerce/inventory-items/dto/request/update-inventory-item-storage-type.dto';
import type { UpdateInventoryItemUomConversionDto } from '@commerce/inventory-items/dto/request/update-inventory-item-uom-conversion.dto';
import type { InventoryItemMrpResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemMrpTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-mrp-table-response.dto';
import type { InventoryItemResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-response.dto';
import type { InventoryItemStorageTypeResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-storage-type-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-table-response.dto';
import type { InventoryItemUomConversionResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-uom-conversion-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class InventoryItemsGatewayService {
  private readonly logger = new Logger(InventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Creates a new org inventory item
  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log(`org.inventoryItems.create — name: ${dto.name}, sku: ${dto.sku}`);
    return this.nats.send('commerce', 'org.inventoryItems.create', dto);
  }

  // Creates a per-item UOM conversion override
  async createUomConversion(
    inventoryItemId: string,
    dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`org.inventoryItems.uom.create — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.create', { inventoryItemId, ...dto });
  }

  // Adds a manual MRP for an inventory item
  async addMrp(inventoryItemId: string, dto: AddInventoryItemMrpDto): Promise<InventoryItemMrpResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.add — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.add', { inventoryItemId, ...dto });
  }

  // Allows an inventory item in a storage type with a maximum per location
  createStorageType(
    inventoryItemId: string,
    dto: CreateInventoryItemStorageTypeDto,
  ): Promise<CreateResponseDto<InventoryItemStorageTypeResponseDto>> {
    this.logger.log(
      `org.inventoryItems.storageTypes.create — inventoryItemId: ${inventoryItemId}, storageTypeId: ${dto.storageTypeId}`,
    );
    return this.nats.send('commerce', 'org.inventoryItems.storageTypes.create', { inventoryItemId, ...dto });
  }

  // Updates an inventory item
  async update(id: string, dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.update — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.update', { id, ...dto });
  }

  // Updates a per-item UOM conversion override
  async updateUomConversion(
    conversionId: string,
    dto: UpdateInventoryItemUomConversionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.uom.update — id: ${conversionId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.update', { id: conversionId, ...dto });
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

  // Updates an item × storage type row
  updateStorageType(
    inventoryItemId: string,
    id: string,
    dto: UpdateInventoryItemStorageTypeDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.storageTypes.update — inventoryItemId: ${inventoryItemId}, id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.storageTypes.update', { inventoryItemId, id, ...dto });
  }

  // Promotes one recorded MRP to the current one shown on listings
  async setMrpCurrent(inventoryItemId: string, mrpId: string): Promise<InventoryItemMrpResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.setCurrent — inventoryItemId: ${inventoryItemId}, id: ${mrpId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.setCurrent', { id: mrpId });
  }

  // Returns a single inventory item by ID
  async findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`org.inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.findById', { id });
  }

  // Returns paginated org-wide inventory items for the data table
  async findForTable(userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('org.inventoryItems.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-inventory-items');

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated UOM conversion overrides for an inventory item
  async findUomConversionsForTable(inventoryItemId: string, userId: string) {
    this.logger.log(`org.inventoryItems.uom.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Returns an inventory item's MRPs, table-shaped
  async findMrpTable(inventoryItemId: string, userId: string): Promise<InventoryItemMrpTableResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-org-inventory-item-${inventoryItemId}-mrp`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemMrpResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.mrp.table',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns supplier links for a given inventory item, table-shaped
  async findSuppliersTable(inventoryItemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`org.inventoryItems.suppliers.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Returns the storage types an inventory item may be stored in
  findStorageTypes(inventoryItemId: string): Promise<InventoryItemStorageTypeResponseDto[]> {
    this.logger.log(`org.inventoryItems.storageTypes.findAll — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.storageTypes.findAll', { inventoryItemId });
  }

  // Deletes an inventory item
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.delete', { id });
  }

  // Deletes a per-item UOM conversion override
  async deleteUomConversion(conversionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.uom.delete — id: ${conversionId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.delete', { id: conversionId });
  }

  // Deletes a manual MRP for an inventory item
  async deleteMrp(mrpId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.mrp.delete — id: ${mrpId}`);
    return this.nats.send('commerce', 'org.inventoryItems.mrp.delete', { id: mrpId });
  }

  // Stops allowing an inventory item in a storage type
  deleteStorageType(inventoryItemId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.storageTypes.delete — inventoryItemId: ${inventoryItemId}, id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.storageTypes.delete', { inventoryItemId, id });
  }
}
