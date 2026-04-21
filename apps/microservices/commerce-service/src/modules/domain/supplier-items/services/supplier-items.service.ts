import { Injectable } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, supplierItems, uom } from '@/db/schema';
import type { LinkSupplierItemDto } from '@/modules/suppliers/dto/request/link-supplier-item.dto';
import { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SupplierItemsRepository } from '../repositories/supplier-items.repository';

@Injectable()
export class SupplierItemsService {
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

  async findItemIds(supplierId: string): Promise<string[]> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return this.repository.findItemIdsBySupplierId(supplierId);
  }

  async linkItem(supplierId: string, data: LinkSupplierItemDto): Promise<CreateResponseDto<SupplierItemDto>> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const created = await this.repository.createSupplierItem({
      supplierId,
      inventoryItemId: data.inventoryItemId,
      supplierItemCode: data.supplierItemCode ?? null,
      unitPrice: data.unitPrice != null ? String(data.unitPrice) : null,
      uomId: data.uomId,
      minOrderQuantity: data.minOrderQuantity != null ? String(data.minOrderQuantity) : null,
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

  async findItemPrice(supplierId: string, inventoryItemId: string): Promise<{ unitPrice: number | null }> {
    const item = await this.repository.findItemBySupplierAndInventoryItem(supplierId, inventoryItemId);
    return { unitPrice: item?.unitPrice != null ? Number(item.unitPrice) : null };
  }
}
