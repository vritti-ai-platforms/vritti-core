import { InventoryItemSupplierDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  CurrencyAmountDto,
  type CurrencyCode,
  type FieldMap,
  FilterProcessor,
  majorToMinor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, supplierItems, suppliers, uom } from '@/db/schema';
import type { AddSupplierItemDto } from '@/modules/suppliers/items/dto/request/add-supplier-item.dto';
import type { UpdateSupplierItemDto } from '@/modules/suppliers/items/dto/request/update-supplier-item.dto';
import { SupplierItemsRepository } from '../repositories/supplier-items.repository';

@Injectable()
export class SupplierItemsService {
  // Field map for the supplier-rooted "items linked to this supplier" view (joins inventory_items + uom)
  private static readonly FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
    supplierItemCode: { column: supplierItems.supplierItemCode, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    unitPrice: { column: supplierItems.unitPrice, type: 'number' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    leadTimeDays: { column: supplierItems.leadTimeDays, type: 'number' },
    isPreferred: { column: supplierItems.isPreferred, type: 'boolean' },
    isActive: { column: supplierItems.isActive, type: 'boolean' },
  };

  // Field map for the inventory-item-rooted "suppliers carrying this item" view (joins suppliers + uom)
  private static readonly SUPPLIERS_FOR_ITEM_FIELD_MAP: FieldMap = {
    supplierName: { column: suppliers.name, type: 'string' },
    supplierCode: { column: suppliers.code, type: 'string' },
    supplierItemCode: { column: supplierItems.supplierItemCode, type: 'string' },
    uomSymbol: { column: uom.symbol, type: 'string' },
    unitPrice: { column: supplierItems.unitPrice, type: 'number' },
    minOrderQuantity: { column: supplierItems.minOrderQuantity, type: 'number' },
    leadTimeDays: { column: supplierItems.leadTimeDays, type: 'number' },
    isPreferred: { column: supplierItems.isPreferred, type: 'boolean' },
    isActive: { column: supplierItems.isActive, type: 'boolean' },
  };

  constructor(private readonly repository: SupplierItemsRepository) {}

  // Returns paginated supplier item options for select dropdowns and filters.
  // When supplierId is absent, returns all active supplier items across all suppliers (supplier name on description).
  // When excludeOnPurchaseOrderId / excludeOnGoodsReceiptId is supplied, hides items already on that PO / GR.
  findForSelect(
    query: SelectOptionsQueryDto,
    options?: {
      supplierId?: string;
      excludeOnPurchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    return this.repository.findForSelect(
      {
        value: query.valueKey || 'id',
        label: query.labelKey || 'name',
        description: query.descriptionKey,
        additionalKeys: query.additionalKeys,
        groupIdKey: query.groupIdKey || 'categoryId',
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

  async findForTable(supplierId: string, state: TableViewState): Promise<{ result: SupplierItemDto[]; count: number }> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForTable(supplierId, {
      where,
      orderBy,
      limit,
      offset,
    });

    return {
      result: result.map((row) => SupplierItemDto.from(row, row.inventoryItemName, row.uomSymbol)),
      count,
    };
  }

  async findSuppliersForItem(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemSupplierDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemsService.SUPPLIERS_FOR_ITEM_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemsService.SUPPLIERS_FOR_ITEM_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsService.SUPPLIERS_FOR_ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findSuppliersForItem(inventoryItemId, {
      where: where || undefined,
      orderBy,
      limit,
      offset,
    });

    return {
      result: result.map((row) =>
        InventoryItemSupplierDto.from(row, row.supplierName, row.supplierCode, row.uomSymbol),
      ),
      count,
    };
  }

  async findItemIds(supplierId: string): Promise<string[]> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return this.repository.findItemIdsBySupplierId(supplierId);
  }

  // Returns the inventory_item_id that owns a given supplier_items row, or null if not found.
  // Used by top-level cross-domain validation (no inventory-items dependency in this domain).
  async findInventoryItemIdFor(supplierItemId: string): Promise<string | null> {
    const row = await this.repository.findSupplierItemById(supplierItemId);
    return row?.inventoryItemId ?? null;
  }

  async addItem(
    supplierId: string,
    data: AddSupplierItemDto,
    inventoryItemName: string,
  ): Promise<CreateResponseDto<SupplierItemDto>> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const existing = await this.repository.findItemBySupplierInventoryItemAndUom(
      supplierId,
      data.inventoryItemId,
      data.uomId,
    );
    if (existing) {
      throw new BadRequestException({
        label: 'Duplicate Item',
        detail: 'This item with the selected UOM is already linked to this supplier.',
      });
    }

    // Per-row currency must match the supplier's. If they drift, downstream FX math (PO, GR cost
    // association, change-currency rescale) all go wrong. Reject early with a field-scoped error.
    if (data.unitPrice.currency !== supplier.currencyCode) {
      throw new ValidationException({
        detail: `Unit price currency must match the supplier currency (${supplier.currencyCode}).`,
        errors: [{ field: 'unitPrice', message: `Must be in ${supplier.currencyCode}.` }],
      });
    }

    const currencyCode = data.unitPrice.currency as CurrencyCode;
    const unitPriceMinor = majorToMinor(data.unitPrice.value, currencyCode, 'unitPrice');

    // If marking as preferred, clear preferred on any other supplier_item for this inventory item first
    if (data.isPreferred === true) {
      await this.repository.clearPreferredForOtherSuppliers(data.inventoryItemId);
    }

    const [created, uomSymbol] = await Promise.all([
      this.repository.createSupplierItem({
        supplierId,
        inventoryItemId: data.inventoryItemId,
        supplierItemCode: data.supplierItemCode ?? null,
        unitPrice: unitPriceMinor,
        currencyCode,
        uomId: data.uomId,
        minOrderQuantity: data.minOrderQuantity ?? null,
        leadTimeDays: data.leadTimeDays ?? null,
        isPreferred: data.isPreferred ?? false,
        schemeBuyQty: data.schemeBuyQty ?? null,
        schemeFreeQty: data.schemeFreeQty ?? null,
        hasScheme: data.hasScheme ?? false,
      }),
      this.repository.findUomSymbol(data.uomId),
    ]);

    return {
      success: true,
      message: `"${inventoryItemName}" (${uomSymbol}) added to supplier successfully.`,
      data: SupplierItemDto.from(created, inventoryItemName, uomSymbol),
    };
  }

  async updateItem(
    supplierId: string,
    supplierItemId: string,
    data: UpdateSupplierItemDto,
  ): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    const update: Record<string, unknown> = {};

    if (data.supplierItemCode !== undefined) update.supplierItemCode = data.supplierItemCode || null;
    if (data.uomId !== undefined) update.uomId = data.uomId;
    if (data.minOrderQuantity !== undefined) {
      update.minOrderQuantity = data.minOrderQuantity ?? null;
    }
    if (data.leadTimeDays !== undefined) update.leadTimeDays = data.leadTimeDays;
    if (data.isPreferred !== undefined) update.isPreferred = data.isPreferred;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.schemeBuyQty !== undefined) update.schemeBuyQty = data.schemeBuyQty;
    if (data.schemeFreeQty !== undefined) update.schemeFreeQty = data.schemeFreeQty;
    if (data.hasScheme !== undefined) update.hasScheme = data.hasScheme;

    if (data.unitPrice) {
      if (data.unitPrice.currency !== supplier.currencyCode) {
        throw new ValidationException({
          detail: `Unit price currency must match the supplier currency (${supplier.currencyCode}).`,
          errors: [{ field: 'unitPrice', message: `Must be in ${supplier.currencyCode}.` }],
        });
      }
      update.unitPrice = majorToMinor(data.unitPrice.value, data.unitPrice.currency as CurrencyCode, 'unitPrice');
      update.currencyCode = data.unitPrice.currency;
    }

    if (Object.keys(update).length === 0) {
      return { success: true, message: 'No changes to apply.' };
    }

    // If marking as preferred, clear preferred on any other supplier_item for this inventory item first
    if (data.isPreferred === true) {
      await this.repository.clearPreferredForOtherSuppliers(existing.inventoryItemId, supplierItemId);
    }

    await this.repository.updateSupplierItem(supplierItemId, update);
    return { success: true, message: `"${existing.inventoryItemName}" (${existing.uomSymbol}) updated successfully.` };
  }

  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    await this.repository.deleteSupplierItem(supplierItemId);
    return {
      success: true,
      message: `"${existing.inventoryItemName}" (${existing.uomSymbol}) removed from supplier successfully.`,
    };
  }

  // Bulk-removes multiple supplier items for a supplier
  async bulkUnlinkItems(supplierId: string, supplierItemIds: string[]): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.repository.bulkDeleteSupplierItems(supplierItemIds);
    return {
      success: true,
      message: `${supplierItemIds.length} item${supplierItemIds.length === 1 ? '' : 's'} removed from supplier.`,
    };
  }

  // Bulk-sets the free-goods scheme on multiple supplier items at once
  async bulkSetScheme(
    supplierId: string,
    supplierItemIds: string[],
    scheme: { buyQty: number | null; freeQty: number | null; hasScheme: boolean },
  ): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.repository.bulkSetScheme(supplierItemIds, scheme);
    return {
      success: true,
      message: `Scheme updated for ${supplierItemIds.length} item${supplierItemIds.length === 1 ? '' : 's'}.`,
    };
  }

  // Bulk-marks multiple supplier items as preferred (or clears it) in a single request
  async bulkSetPreferred(
    supplierId: string,
    supplierItemIds: string[],
    isPreferred: boolean,
  ): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    await this.repository.bulkSetPreferred(supplierItemIds, isPreferred);
    return {
      success: true,
      message: `${supplierItemIds.length} item${supplierItemIds.length === 1 ? '' : 's'} marked ${isPreferred ? 'preferred' : 'not preferred'}.`,
    };
  }

  async findItemPrice(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    const item = await this.repository.findItemBySupplierInventoryItemAndUom(supplierId, inventoryItemId, uomId);
    return { unitPrice: CurrencyAmountDto.from(item?.unitPrice ?? null, item?.currencyCode ?? '') };
  }
}
