import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { GoodsReceiptStatusValues, goodsReceiptItems, inventoryItems } from '@/db/schema';
import { GoodsReceiptItemDto } from '../dto/entity/goods-receipt-item.dto';
import type { GoodsReceiptTreeNode } from '../dto/entity/goods-receipt-tree.dto';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptItemsService {
  private readonly logger = new Logger(GoodsReceiptItemsService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
  };

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    rejectedQuantity: { column: goodsReceiptItems.rejectedQuantity, type: 'number' },
  };

  constructor(
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
    private readonly supplierItemsRepository: SupplierItemsRepository,
    private readonly uomConversionsService: UomConversionsService,
  ) {}

  // Converts a unit price from the GR-item's UOM to the inventory item's primary UOM
  private async resolvePrimaryUomUnitPrice(inventoryItemId: string, uomId: string, unitPrice: bigint): Promise<bigint> {
    const oneInPrimary = await this.uomConversionsService.toPrimaryQuantity(inventoryItemId, uomId, 1);
    if (oneInPrimary <= 0) return unitPrice;
    return BigInt(
      new Decimal(unitPrice.toString()).dividedBy(oneInPrimary).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
  }

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    return this.itemsRepository.findInventoryItemIds(goodsReceiptId);
  }

  async findForTable(
    goodsReceiptId: string,
    state: TableViewState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    await this.ensureReceiptExists(goodsReceiptId);

    const filterWhere = FilterProcessor.buildWhere(state.filters, GoodsReceiptItemsService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, GoodsReceiptItemsService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.itemsRepository.findForTable(goodsReceiptId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, {
        ...GoodsReceiptItemsService.SEARCH_FIELD_MAP,
        ...GoodsReceiptItemsService.FILTER_FIELD_MAP,
      }),
      limit,
      offset,
    });

    return { result: result.map(GoodsReceiptItemDto.from), count };
  }

  async findById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemDto> {
    await this.ensureReceiptExists(goodsReceiptId);
    const row = await this.itemsRepository.findByReceiptIdAndItemIdWithRefs(goodsReceiptId, itemId);
    if (!row) throw new NotFoundException('Goods receipt item not found.');
    return GoodsReceiptItemDto.from(row);
  }

  // Returns the unified GR tree: items as roots, lots/lines as descendants per item.tracking.
  async findTreeForReceipt(goodsReceiptId: string): Promise<GoodsReceiptTreeNode[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    return this.itemsRepository.findTreeNodesByReceiptId(goodsReceiptId);
  }

  // Adds an item to a GR by referencing a supplier_items row when there is no linked PO
  async addItemFromSupplierItem(
    goodsReceiptId: string,
    data: {
      supplierItemId: string;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);

    const supplierItem = await this.supplierItemsRepository.findById(data.supplierItemId);
    if (!supplierItem) throw new NotFoundException('Supplier item not found.');
    if (supplierItem.supplierId !== receipt.supplierId) {
      throw new BadRequestException({
        label: 'Supplier Mismatch',
        detail: "Supplier item does not belong to this goods receipt's supplier.",
      });
    }

    return this.addItemInternal(receipt, {
      inventoryItemId: supplierItem.inventoryItemId,
      uomId: supplierItem.uomId,
      rejectedQuantity: data.rejectedQuantity,
      unitPrice: data.unitPrice,
      currencyCode: data.currencyCode,
    });
  }

  // Add an item to a GR by referencing a purchase_order_items row. Used when the GR is linked to a PO.
  async addItemFromPurchaseOrderItem(
    goodsReceiptId: string,
    data: {
      purchaseOrderItemId: string;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);

    if (!receipt.purchaseOrderId) {
      throw new BadRequestException({
        label: 'No Purchase Order',
        detail: 'Cannot add a purchase order line to a goods receipt that has no linked PO.',
      });
    }

    const poItem = await this.poItemsRepository.findById(data.purchaseOrderItemId);
    if (!poItem) throw new NotFoundException('Purchase order line not found.');
    if (poItem.purchaseOrderId !== receipt.purchaseOrderId) {
      throw new BadRequestException({
        label: 'Purchase Order Mismatch',
        detail: "Purchase order line does not belong to this goods receipt's purchase order.",
      });
    }

    return this.addItemInternal(receipt, {
      inventoryItemId: poItem.inventoryItemId,
      uomId: poItem.uomId,
      rejectedQuantity: data.rejectedQuantity,
      unitPrice: data.unitPrice,
      currencyCode: data.currencyCode,
    });
  }

  // Performs the duplicate guard, persists the item, and loads the DTO
  private async addItemInternal(
    receipt: { id: string; grNumber: string; purchaseOrderId: string | null },
    data: {
      inventoryItemId: string;
      uomId: string;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
    },
  ): Promise<CreateResponseDto<GoodsReceiptItemDto>> {
    // Reject duplicate (DB also enforces unique constraint, but produce a clean error)
    const existing = await this.itemsRepository.findByReceiptInventoryItemAndUom(
      receipt.id,
      data.inventoryItemId,
      data.uomId,
    );
    if (existing) {
      throw new ValidationException({
        detail: 'This item and UOM combination is already on the goods receipt.',
        errors: [{ field: 'inventoryItemId', message: 'Already added to this goods receipt.' }],
      });
    }

    if (data.rejectedQuantity !== undefined) {
      this.validateRejectedQuantity(data.rejectedQuantity);
    }

    const primaryUomUnitPrice =
      data.unitPrice != null
        ? await this.resolvePrimaryUomUnitPrice(data.inventoryItemId, data.uomId, data.unitPrice)
        : null;

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
    const entity = await this.itemsRepository.create({
      goodsReceiptId: receipt.id,
      inventoryItemId: data.inventoryItemId,
      uomId: data.uomId,
      rejectedQuantity: data.rejectedQuantity ?? 0,
      unitPrice: data.unitPrice ?? null,
      primaryUomUnitPrice,
      currencyCode: data.currencyCode ?? null,
    });

    this.logger.log(`Added item ${entity.id} to goods receipt ${receipt.id}`);
    const dto = await this.findById(receipt.id, entity.id);
    return {
      success: true,
      message: `Item added to goods receipt "${receipt.grNumber}".`,
      data: dto,
    };
  }

  // Updates an existing item's rejected quantity and captured supplier price
  async updateItem(
    goodsReceiptId: string,
    itemId: string,
    data: {
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
    },
  ): Promise<SuccessResponseDto> {
    await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');

    if (data.rejectedQuantity !== undefined) {
      this.validateRejectedQuantity(data.rejectedQuantity);
    }

    const update: Record<string, unknown> = {};
    if (data.rejectedQuantity !== undefined) update.rejectedQuantity = data.rejectedQuantity;
    if (data.unitPrice !== undefined) {
      update.unitPrice = data.unitPrice;
      update.primaryUomUnitPrice = await this.resolvePrimaryUomUnitPrice(
        item.inventoryItemId,
        item.uomId,
        data.unitPrice,
      );
    }
    if (data.currencyCode !== undefined) update.currencyCode = data.currencyCode;

    if (Object.keys(update).length > 0) {
      await this.itemsRepository.update(item.id, update);
    }
    return { success: true, message: 'Item updated.' };
  }

  async removeItem(goodsReceiptId: string, itemId: string): Promise<SuccessResponseDto> {
    const receipt = await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemId(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
    await this.itemsRepository.delete(item.id);
    return { success: true, message: `Item removed from goods receipt "${receipt.grNumber}".` };
  }

  private validateRejectedQuantity(rejectedQuantity: number) {
    if (!Number.isFinite(rejectedQuantity) || rejectedQuantity < 0) {
      throw new BadRequestException('rejectedQuantity must be greater than or equal to 0.');
    }
  }

  private async ensureReceiptExists(goodsReceiptId: string) {
    const receipt = await this.receiptsRepository.findById(goodsReceiptId);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    return receipt;
  }

  private async ensureEditableReceipt(goodsReceiptId: string) {
    const receipt = await this.ensureReceiptExists(goodsReceiptId);
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Items can only be modified on DRAFT goods receipts.');
    }
    return receipt;
  }
}
