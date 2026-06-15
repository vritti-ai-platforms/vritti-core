import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { inventoryItems } from '@/db/schema';
import type { CreateInventoryItemDto } from '@/modules/inventory-items/root/dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '@/modules/inventory-items/root/dto/request/update-inventory-item.dto';
import { InventoryItemDto } from '../dto/entity/inventory-item.dto';
import { InventoryItemsRepository } from '../repositories/inventory-items.repository';

@Injectable()
export class InventoryItemsService {
  private readonly logger = new Logger(InventoryItemsService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: { column: inventoryItems.name, type: 'string' },
    code: { column: inventoryItems.code, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    type: { column: inventoryItems.type, type: 'string' },
    tracking: { column: inventoryItems.tracking, type: 'string' },
    categoryId: { column: inventoryItems.categoryId, type: 'string' },
    uomId: { column: inventoryItems.uomId, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemsRepository) {}

  // Returns paginated, filtered, and sorted inventory items for the data table
  async findForTable(state: TableViewState, buCurrencyCode?: string): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemsService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsService.SEARCH_FIELD_MAP,
      ...InventoryItemsService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithUom({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    const dtos = rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName, buCurrencyCode));

    return { result: dtos, count };
  }

  // Returns paginated inventory items scoped to a single category (for the category detail items table)
  async findForTableByCategory(
    categoryId: string,
    state: TableViewState,
    buCurrencyCode?: string,
  ): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemsService.SEARCH_FIELD_MAP);
    const where = and(eq(inventoryItems.categoryId, categoryId), filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsService.SEARCH_FIELD_MAP,
      ...InventoryItemsService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithUom({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    return {
      result: rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName, buCurrencyCode)),
      count,
    };
  }

  findForSelect(query: SelectOptionsQueryDto, options?: { excludeOnSupplierId?: string }): Promise<SelectQueryResult> {
    return this.repository.findForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey,
        search: query.search,
        limit: query.limit,
        offset: query.offset,
        values: query.values,
        excludeIds: query.excludeIds,
        orderByKey: query.orderByKey || 'name',
        orderDirection: query.orderDirection || 'asc',
      },
      options,
    );
  }

  private async resolveMrpBridge(
    data: CreateInventoryItemDto,
  ): Promise<{ uomId: string; primaryUomQty: number; uomQty: number } | null> {
    if (!data.hasMrp || !data.mrpUomId) return null;
    const derivable = (await this.repository.findUomFamilyIds(data.uomId)).includes(data.mrpUomId);
    if (derivable) return null;
    if (data.mrpUomId === data.uomId) {
      throw new ValidationException({
        detail: 'MRP unit cannot equal the primary unit.',
        errors: [{ field: 'mrpUomId', message: 'Pick a unit different from the primary unit.' }],
      });
    }
    if (!data.mrpUomConversion) {
      throw new ValidationException({
        detail: "MRP unit can't be derived from the primary unit — provide its conversion.",
        errors: [{ field: 'mrpUomConversion', message: 'Provide how many primary units one MRP unit holds.' }],
      });
    }
    const uomInfo = await this.repository.findUomBaseUnitId(data.mrpUomId);
    if (!uomInfo) throw new NotFoundException('MRP unit not found.');
    if (uomInfo.baseUnitId != null) {
      throw new ValidationException({
        detail: 'A conversion can only be defined for a base unit.',
        errors: [{ field: 'mrpUomId', message: 'This unit is derived; pick a base unit.' }],
      });
    }
    return {
      uomId: data.mrpUomId,
      primaryUomQty: data.mrpUomConversion.primaryUomQty,
      uomQty: data.mrpUomConversion.uomQty,
    };
  }

  async create(data: CreateInventoryItemDto, buCurrencyCode?: string): Promise<CreateResponseDto<InventoryItemDto>> {
    const bridgeConversion = await this.resolveMrpBridge(data);
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      ...(data.tracking ? { tracking: data.tracking } : {}),
      ...(data.pickStrategy ? { pickStrategy: data.pickStrategy } : {}),
      categoryId: data.categoryId,
      description: data.description || null,
      uomId: data.uomId,
      purchaseTaxGroupId: data.purchaseTaxGroupId ?? null,
      hsnCode: data.hsnCode ?? null,
      hasMrp: data.hasMrp ?? false,
      mrpUomId: data.hasMrp ? (data.mrpUomId ?? null) : null,
      defaultMrp:
        data.hasMrp && data.defaultMrp
          ? majorToMinor(data.defaultMrp.value, data.defaultMrp.currency as CurrencyCode, 'defaultMrp')
          : null,
    });
    if (bridgeConversion) {
      await this.repository.insertConversion(entity.id, bridgeConversion);
    }
    const [uomSymbol, categoryName] = await Promise.all([
      this.repository.findUomSymbol(entity.uomId),
      this.repository.findCategoryName(entity.categoryId),
    ]);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Inventory item "${entity.name}" (${entity.code}) created successfully.`,
      data: InventoryItemDto.from(entity, uomSymbol, true, categoryName, buCurrencyCode),
    };
  }

  // Returns a single inventory item with UOM symbol and canDelete
  async findById(id: string, buCurrencyCode?: string): Promise<InventoryItemDto> {
    const entity = await this.repository.findByIdWithUomAndCategory(id);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const referencedIds = await this.repository.findReferencedIds([id]);
    return InventoryItemDto.from(entity, entity.uomSymbol, !referencedIds.has(id), entity.categoryName, buCurrencyCode);
  }

  // Returns the UOM IDs the given item can transact in: primary + per-item conversions + globally derivable family
  async findAllowedUomIds(inventoryItemId: string): Promise<{ name: string; allowedUomIds: string[] }> {
    const entity = await this.repository.findById(inventoryItemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const allowedUomIds = await this.repository.findAllowedUomIds(inventoryItemId);
    return { name: entity.name, allowedUomIds };
  }

  // Updates an inventory item. Tracking is set at creation and cannot be changed.
  async update(id: string, data: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    if (data.uomId && data.uomId !== existing.uomId) {
      const refs = await this.repository.countReferences(id);
      if (refs.purchaseOrderItems > 0 || refs.stockAdjustments > 0 || refs.stockTransfers > 0) {
        throw new BadRequestException({
          label: 'UOM Locked',
          detail: 'Primary UOM cannot be changed after the item has transaction history.',
        });
      }
    }

    if (data.description !== undefined) data.description = data.description || null;
    const { defaultMrp, mrpUomId, hasMrp, ...rest } = data;
    if (hasMrp !== false && mrpUomId) {
      const allowed = await this.repository.findAllowedUomIds(id);
      if (!allowed.includes(mrpUomId)) {
        throw new ValidationException({
          detail: "MRP unit must be the item's primary unit or one of its conversions.",
          errors: [{ field: 'mrpUomId', message: 'Add a conversion for this unit, or pick an existing one.' }],
        });
      }
    }
    const updated = await this.repository.update(id, {
      ...rest,
      ...(hasMrp !== undefined ? { hasMrp } : {}),
      ...(hasMrp === false
        ? { mrpUomId: null, defaultMrp: null }
        : {
            ...(mrpUomId !== undefined ? { mrpUomId: mrpUomId ?? null } : {}),
            ...(defaultMrp !== undefined
              ? {
                  defaultMrp: defaultMrp
                    ? majorToMinor(defaultMrp.value, defaultMrp.currency as CurrencyCode, 'defaultMrp')
                    : null,
                }
              : {}),
          }),
    });
    this.logger.log(`Updated inventory item: ${updated.name} (${updated.code})`);
    return { success: true, message: `Inventory item "${updated.name}" updated successfully.` };
  }

  // Deletes an inventory item; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [
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
