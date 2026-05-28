import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  type CurrencyCode,
  type FieldMap,
  FilterProcessor,
  minorToMajor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { and } from '@vritti/api-sdk/drizzle-orm';

function minorToMajorAmount(minor: bigint, currency: string): { currency: string; value: string } {
  return { currency, value: minorToMajor(minor, currency as CurrencyCode) };
}
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

  // Converts a unit price expressed in the GR-item's UOM to the inventory item's primary UOM
  // via Decimal. `unitPrice` is per uom-unit; we divide by (uom_qty / primary_uom_qty) which is
  // the same as multiplying by (primary_uom_qty / uom_qty) — i.e., one uom-unit = one factor of
  // primary-units, so the per-primary-unit price is `unitPrice / factor`.
  private async resolvePrimaryUomUnitPrice(
    inventoryItemId: string,
    uomId: string,
    unitPrice: bigint,
  ): Promise<bigint> {
    const oneInPrimary = await this.uomConversionsService.toPrimaryQuantity(inventoryItemId, uomId, 1);
    if (oneInPrimary <= 0) return unitPrice;
    return BigInt(
      new Decimal(unitPrice.toString())
        .dividedBy(oneInPrimary)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );
  }

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    return this.itemsRepository.findInventoryItemIds(goodsReceiptId);
  }

  async findByGoodsReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemDto[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    const rows = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    return rows.map(GoodsReceiptItemDto.from);
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

  // Add an item to a goods receipt. The caller picks a supplier item; we resolve it to its
  // inventoryItemId server-side (validating that it belongs to the GR's supplier first), then
  // run the existing PO-line and duplicate checks against the resolved inventoryItemId.
  // acceptedQuantity is derived from sum(lines.quantity); only rejectedQuantity is stored here.
  async addItem(
    goodsReceiptId: string,
    data: {
      supplierItemId: string;
      rejectedQuantity?: number;
      // Captured at the breakdown step (Phase 5.5). Required for the auto-associate flow to
      // create a SUPPLIER_PRICE cost row at publish, even when the GR has no PO link.
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

    const inventoryItemId = supplierItem.inventoryItemId;
    const uomId = supplierItem.uomId;

    if (receipt.purchaseOrderId) {
      const poItem = await this.poItemsRepository.findItemByInventoryItemAndUom(
        receipt.purchaseOrderId,
        inventoryItemId,
        uomId,
      );
      if (!poItem) {
        throw new BadRequestException('This item and UOM combination is not on the linked purchase order.');
      }
    }

    // Reject duplicate (DB also enforces unique constraint, but produce a clean error)
    const existing = await this.itemsRepository.findByReceiptInventoryItemAndUom(
      goodsReceiptId,
      inventoryItemId,
      uomId,
    );
    if (existing) {
      throw new ValidationException({
        detail: 'This item and UOM combination is already on the goods receipt.',
        errors: [{ field: 'supplierItemId', message: 'Already added to this goods receipt.' }],
      });
    }

    if (data.rejectedQuantity !== undefined) {
      this.validateRejectedQuantity(data.rejectedQuantity);
    }

    const primaryUomUnitPrice = data.unitPrice != null
      ? await this.resolvePrimaryUomUnitPrice(inventoryItemId, uomId, data.unitPrice)
      : null;

    let entity: Awaited<ReturnType<typeof this.itemsRepository.create>>;
    try {
      entity = await this.itemsRepository.create({
        goodsReceiptId,
        inventoryItemId,
        uomId,
        rejectedQuantity: data.rejectedQuantity ?? 0,
        unitPrice: data.unitPrice ?? null,
        primaryUomUnitPrice,
        currencyCode: data.currencyCode ?? null,
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException({
          label: 'Duplicate Item',
          detail: 'This item and UOM combination is already on the goods receipt.',
          errors: [{ field: 'supplierItemId', message: 'Already added to this goods receipt.' }],
        });
      }
      throw error;
    }

    this.logger.log(`Added item ${entity.id} to goods receipt ${goodsReceiptId}`);
    const dto = await this.findById(goodsReceiptId, entity.id);
    return {
      success: true,
      message: `Item added to goods receipt "${receipt.grNumber}".`,
      data: dto,
    };
  }

  // Update an existing item. `rejectedQuantity` and the captured supplier price (unitPrice +
  // currencyCode) are editable; inventoryItemId / uomId are set-once.
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

  // Used by the Add Item dialog (PR5b) to pre-fill the supplier unit price after the user
  // selects a supplier item. Resolution order: PO → supplier_items → null. Returned in major
  // units so the gateway can hand it straight to a CurrencyField on the frontend.
  async resolvePricePrefill(
    goodsReceiptId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<{ unitPrice: { currency: string; value: string } | null; source: 'PO' | 'SUPPLIER_ITEM' | null }> {
    const receipt = await this.ensureReceiptExists(goodsReceiptId);

    if (receipt.purchaseOrderId) {
      const poItem = await this.poItemsRepository.findItemByInventoryItemAndUom(
        receipt.purchaseOrderId,
        inventoryItemId,
        uomId,
      );
      if (poItem) {
        return {
          unitPrice: minorToMajorAmount(BigInt(poItem.unitPrice as unknown as string), poItem.currencyCode),
          source: 'PO',
        };
      }
    }

    const supplierItem = await this.supplierItemsRepository.findItemBySupplierInventoryItemAndUom(
      receipt.supplierId,
      inventoryItemId,
      uomId,
    );
    if (supplierItem?.unitPrice != null && supplierItem.currencyCode) {
      return {
        unitPrice: minorToMajorAmount(BigInt(supplierItem.unitPrice as unknown as string), supplierItem.currencyCode),
        source: 'SUPPLIER_ITEM',
      };
    }

    return { unitPrice: null, source: null };
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
