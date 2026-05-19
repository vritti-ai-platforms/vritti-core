import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type CurrencyAmountDto,
  type CurrencyCode,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  majorToMinor,
  minorToMajor,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, supplierItems, suppliers, uom } from '@/db/schema';
import type { LinkSupplierItemDto } from '@/modules/suppliers/items/dto/request/link-supplier-item.dto';
import type { UpdateSupplierItemDto } from '@/modules/suppliers/items/dto/request/update-supplier-item.dto';
import { InventoryItemSupplierDto, SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
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

  async findForTable(
    supplierId: string,
    state: TableViewState,
  ): Promise<{ result: SupplierItemDto[]; count: number }> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const filterWhere = FilterProcessor.buildWhere(state.filters, SupplierItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, SupplierItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, SupplierItemsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForTable(supplierId, {
      where: where || undefined,
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

  async linkItem(supplierId: string, data: LinkSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const currencyCode = data.unitPrice.currency as CurrencyCode;
    let unitPriceMinor: number;
    try {
      unitPriceMinor = Number(majorToMinor(data.unitPrice.value, currencyCode));
    } catch (e) {
      throw new BadRequestException({
        label: 'Invalid Price',
        detail: e instanceof Error ? e.message : 'Invalid price value.',
      });
    }

    // If marking as preferred, clear preferred on any other supplier_item for this inventory item first
    if (data.isPreferred === true) {
      await this.repository.clearPreferredForOtherSuppliers(data.inventoryItemId);
    }

    const created = await this.repository.createSupplierItem({
      supplierId,
      inventoryItemId: data.inventoryItemId,
      supplierItemCode: data.supplierItemCode ?? null,
      unitPrice: unitPriceMinor,
      currencyCode,
      uomId: data.uomId,
      minOrderQuantity: data.minOrderQuantity ?? null,
      leadTimeDays: data.leadTimeDays ?? null,
      isPreferred: data.isPreferred ?? false,
    });

    const linked = await this.repository.findSupplierItemById(created.id);
    if (!linked) throw new NotFoundException('Supplier item not found.');

    return {
      success: true,
      message: 'Item linked to supplier successfully.',
      data: SupplierItemDto.from(linked, linked.inventoryItemName, linked.uomSymbol),
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

    if (data.unitPrice !== undefined) {
      if (data.unitPrice === null) {
        update.unitPrice = null;
      } else {
        try {
          update.unitPrice = Number(majorToMinor(data.unitPrice.value, data.unitPrice.currency as CurrencyCode));
          update.currencyCode = data.unitPrice.currency;
        } catch (e) {
          throw new BadRequestException({
            label: 'Invalid Price',
            detail: e instanceof Error ? e.message : 'Invalid price value.',
          });
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return { success: true, message: 'No changes to apply.' };
    }

    // If marking as preferred, clear preferred on any other supplier_item for this inventory item first
    if (data.isPreferred === true) {
      await this.repository.clearPreferredForOtherSuppliers(existing.inventoryItemId, supplierItemId);
    }

    update.updatedAt = new Date();
    await this.repository.updateSupplierItem(supplierItemId, update);
    return { success: true, message: 'Supplier item updated successfully.' };
  }

  async unlinkItem(supplierId: string, supplierItemId: string): Promise<SuccessResponseDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const existing = await this.repository.findSupplierItemById(supplierItemId);
    if (!existing || existing.supplierId !== supplierId) {
      throw new NotFoundException('Supplier item not found.');
    }

    await this.repository.deleteSupplierItem(supplierItemId);
    return { success: true, message: `Supplier item link "${supplierItemId}" removed successfully.` };
  }

  async findItemPrice(supplierId: string, inventoryItemId: string): Promise<{ unitPrice: CurrencyAmountDto | null }> {
    const item = await this.repository.findItemBySupplierAndInventoryItem(supplierId, inventoryItemId);
    if (item?.unitPrice == null) return { unitPrice: null };
    const code = item.currencyCode as CurrencyCode;
    return { unitPrice: { currency: code, value: minorToMajor(BigInt(item.unitPrice), code) } };
  }
}
