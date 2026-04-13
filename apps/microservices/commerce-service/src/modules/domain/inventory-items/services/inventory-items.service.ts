import type {
  InventoryItemBatchDto,
  LocationStockDto,
} from '@domain/inventory-item-batches/dto/entity/inventory-item-batch.dto';
import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import type { StorageLocationConfigDto } from '@domain/storage-location-configs/dto/entity/storage-location-config.dto';
import { StorageLocationConfigsService } from '@domain/storage-location-configs/services/storage-location-configs.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems } from '@/db/schema';
import type { CreateInventoryItemDto } from '@/modules/inventory-items/dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '@/modules/inventory-items/dto/request/update-inventory-item.dto';
import { InventoryItemDto } from '../dto/entity/inventory-item.dto';
import { InventoryItemsRepository } from '../repositories/inventory-items.repository';

@Injectable()
export class InventoryItemsService {
  private readonly logger = new Logger(InventoryItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: inventoryItems.name, type: 'string' },
    code: { column: inventoryItems.code, type: 'string' },
    type: { column: inventoryItems.type, type: 'string' },
    uomId: { column: inventoryItems.uomId, type: 'string' },
  };

  constructor(
    private readonly repository: InventoryItemsRepository,
    private readonly batchesService: InventoryItemBatchesService,
    private readonly storageLocationConfigsService: StorageLocationConfigsService,
  ) {}

  // Returns paginated, filtered, and sorted inventory items for the data table
  async findForTable(state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search ?? null, InventoryItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result: rows, count } = await this.repository.findAllWithUom({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    const dtos = rows.map((row) => InventoryItemDto.from(row, row.uomSymbol));

    return { result: dtos, count };
  }

  // Returns paginated inventory item options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      groupId: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderBy: { name: 'asc' },
    });
  }

  // Creates a new inventory item
  async create(data: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      description: data.description || null,
      uomId: data.uomId,
    });
    const uomSymbol = await this.repository.findUomSymbol(entity.uomId);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Inventory item "${entity.name}" (${entity.code}) created successfully.`,
      data: InventoryItemDto.from(entity, uomSymbol),
    };
  }

  // Returns a single inventory item with UOM symbol and canDelete
  async findById(id: string): Promise<InventoryItemDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const [uomSymbol, referencedIds] = await Promise.all([
      this.repository.findUomSymbol(entity.uomId),
      this.repository.findReferencedIds([id]),
    ]);
    return InventoryItemDto.from(entity, uomSymbol, !referencedIds.has(id));
  }

  // Returns paginated batches for an inventory item
  async findBatchesForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemBatchDto[]; count: number }> {
    const entity = await this.repository.findById(itemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    return this.batchesService.findBatchesForTable(itemId, state);
  }

  // Returns location-wise stock aggregates from the inventoryLevels view
  async findLocationStock(itemId: string): Promise<LocationStockDto[]> {
    const entity = await this.repository.findById(itemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    return this.batchesService.findLocationStockByItemId(itemId);
  }

  // Returns paginated storage location configs for an item
  async findStorageLocationConfigs(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: StorageLocationConfigDto[]; count: number }> {
    const entity = await this.repository.findById(itemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    return this.storageLocationConfigsService.findForTable(itemId, state);
  }

  // Creates a storage location config for an item
  async createStorageLocationConfig(
    itemId: string,
    data: { locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<StorageLocationConfigDto>> {
    const entity = await this.repository.findById(itemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    return this.storageLocationConfigsService.create(itemId, data);
  }

  // Updates a storage location config
  async updateStorageLocationConfig(id: string, data: { reorderLevel: number }): Promise<SuccessResponseDto> {
    return this.storageLocationConfigsService.update(id, data);
  }

  // Deletes a storage location config
  async deleteStorageLocationConfig(id: string): Promise<SuccessResponseDto> {
    return this.storageLocationConfigsService.delete(id);
  }

  // Updates an inventory item
  async update(id: string, data: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');
    if (data.description !== undefined) data.description = data.description || null;
    await this.repository.update(id, data);
    this.logger.log(`Updated inventory item: ${existing.name} (${existing.code})`);
    return { success: true, message: `Inventory item "${existing.name}" updated successfully.` };
  }

  // Deletes an inventory item; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.bomLines, 'BOM line'],
      [refs.conversions, 'conversion'],
      [refs.stockAdjustments, 'stock adjustment'],
      [refs.stockTransfers, 'stock transfer'],
      [refs.purchaseOrderItems, 'purchase order item'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Inventory Item In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted inventory item: ${existing.name} (${id})`);
    return { success: true, message: `Inventory item "${existing.name}" deleted successfully.` };
  }
}
