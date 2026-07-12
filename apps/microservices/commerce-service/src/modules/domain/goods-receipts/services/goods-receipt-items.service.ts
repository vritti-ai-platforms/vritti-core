import { PurchaseOrderItemsRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import { computeFreeQty } from '@/common/free-qty';
import { GoodsReceiptStatusValues, goodsReceiptItems, inventoryItems } from '@/db/schema';

type FreeScheme = { buyQty: number | null; freeQty: number | null; hasScheme: boolean };

import { GoodsReceiptItemDto } from '../dto/entity/goods-receipt-item.dto';
import { GoodsReceiptItemsCostDto } from '../dto/entity/goods-receipt-items-cost.dto';
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
    const oneInPrimary = await this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, uomId, 1);
    if (oneInPrimary <= 0) return unitPrice;
    return BigInt(
      new Decimal(unitPrice.toString()).dividedBy(oneInPrimary).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
  }

  // Effective per-unit cost after the scheme = unit_price × ordered_qty / total_qty (free units dilute
  // it). In the item's UOM and supplier currency; null when there's no price or no quantity yet.
  private computeUnitCost(unitPrice: bigint | null, orderedQty: number, totalQty: number): bigint | null {
    if (unitPrice == null || totalQty <= 0) return null;
    return BigInt(
      new Decimal(unitPrice.toString())
        .times(orderedQty)
        .dividedBy(totalQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );
  }

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    await this.ensureReceiptExists(goodsReceiptId);
    return this.itemsRepository.findInventoryItemIds(goodsReceiptId);
  }

  async findForTable(
    goodsReceiptId: string,
    state: TableViewState,
    siteCurrencyCode?: string,
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

    return { result: result.map((row) => GoodsReceiptItemDto.from(row, siteCurrencyCode)), count };
  }

  async findItemsCost(goodsReceiptId: string): Promise<GoodsReceiptItemsCostDto> {
    await this.ensureReceiptExists(goodsReceiptId);
    const items = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    return GoodsReceiptItemsCostDto.from(items);
  }

  async findById(goodsReceiptId: string, itemId: string, siteCurrencyCode?: string): Promise<GoodsReceiptItemDto> {
    await this.ensureReceiptExists(goodsReceiptId);
    const row = await this.itemsRepository.findByReceiptIdAndItemIdWithRefs(goodsReceiptId, itemId);
    if (!row) throw new NotFoundException('Goods receipt item not found.');
    return GoodsReceiptItemDto.from(row, siteCurrencyCode);
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
      orderedQty: number;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
      schemeBuyQty?: number;
      schemeFreeQty?: number;
      hasScheme?: boolean;
    },
    siteCurrencyCode?: string,
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

    // Scheme from the form, falling back to the supplier item's standing scheme.
    const scheme: FreeScheme = {
      buyQty: data.schemeBuyQty ?? supplierItem.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? supplierItem.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? supplierItem.hasScheme ?? false,
    };

    // Un-linked GR: the ordered (paid) quantity is uncapped.
    return this.addItemInternal(
      receipt,
      {
        inventoryItemId: supplierItem.inventoryItemId,
        uomId: supplierItem.uomId,
        orderedQty: data.orderedQty,
        rejectedQuantity: data.rejectedQuantity,
        unitPrice: data.unitPrice,
        currencyCode: data.currencyCode,
        scheme,
      },
      siteCurrencyCode,
    );
  }

  // Add an item to a GR by referencing a purchase_order_items row. Used when the GR is linked to a PO.
  async addItemFromPurchaseOrderItem(
    goodsReceiptId: string,
    data: {
      purchaseOrderItemId: string;
      orderedQty: number;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
      schemeBuyQty?: number;
      schemeFreeQty?: number;
      hasScheme?: boolean;
    },
    siteCurrencyCode?: string,
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

    // PO-linked: the ordered (paid) quantity can't exceed what's still outstanding on the PO line.
    this.validateQuantityAgainstPoRemaining(
      data.orderedQty,
      Number(poItem.uomQty),
      Number(poItem.receivedQuantity ?? 0),
    );

    // Scheme from the form, falling back to the PO line's scheme.
    const scheme: FreeScheme = {
      buyQty: data.schemeBuyQty ?? poItem.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? poItem.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? poItem.hasScheme ?? false,
    };

    return this.addItemInternal(
      receipt,
      {
        inventoryItemId: poItem.inventoryItemId,
        uomId: poItem.uomId,
        orderedQty: data.orderedQty,
        rejectedQuantity: data.rejectedQuantity,
        unitPrice: data.unitPrice,
        currencyCode: data.currencyCode,
        scheme,
      },
      siteCurrencyCode,
    );
  }

  // Performs the duplicate guard, persists the item, and loads the DTO
  private async addItemInternal(
    receipt: { id: string; grNumber: string; purchaseOrderId: string | null },
    data: {
      inventoryItemId: string;
      uomId: string;
      orderedQty: number;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
      scheme: FreeScheme;
    },
    siteCurrencyCode?: string,
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

    this.validateOrderedQty(data.orderedQty);
    if (data.rejectedQuantity !== undefined) {
      this.validateRejectedQuantity(data.rejectedQuantity);
    }

    const primaryUomUnitPrice =
      data.unitPrice != null
        ? await this.resolvePrimaryUomUnitPrice(data.inventoryItemId, data.uomId, data.unitPrice)
        : null;

    const freeQty = computeFreeQty(data.orderedQty, data.scheme.buyQty, data.scheme.freeQty, data.scheme.hasScheme);
    const totalQty = data.orderedQty + freeQty;
    const unitCost = this.computeUnitCost(data.unitPrice ?? null, data.orderedQty, totalQty);

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
    const entity = await this.itemsRepository.create({
      goodsReceiptId: receipt.id,
      inventoryItemId: data.inventoryItemId,
      uomId: data.uomId,
      orderedQty: data.orderedQty,
      freeQty,
      totalQty,
      schemeBuyQty: data.scheme.buyQty,
      schemeFreeQty: data.scheme.freeQty,
      hasScheme: data.scheme.hasScheme,
      rejectedQuantity: data.rejectedQuantity ?? 0,
      unitPrice: data.unitPrice ?? null,
      primaryUomUnitPrice,
      unitCost,
      currencyCode: data.currencyCode ?? null,
    });

    this.logger.log(`Added item ${entity.id} to goods receipt ${receipt.id}`);
    const dto = await this.findById(receipt.id, entity.id, siteCurrencyCode);
    return {
      success: true,
      message: `Item added to goods receipt "${receipt.grNumber}".`,
      data: dto,
    };
  }

  // Updates an existing item's ordered quantity, free-goods scheme, rejected quantity and price.
  async updateItem(
    goodsReceiptId: string,
    itemId: string,
    data: {
      orderedQty?: number;
      rejectedQuantity?: number;
      unitPrice?: bigint;
      currencyCode?: string;
      schemeBuyQty?: number;
      schemeFreeQty?: number;
      hasScheme?: boolean;
    },
  ): Promise<SuccessResponseDto> {
    await this.ensureEditableReceipt(goodsReceiptId);
    const item = await this.itemsRepository.findByReceiptIdAndItemIdWithRefs(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');

    if (data.orderedQty !== undefined) {
      this.validateOrderedQty(data.orderedQty);
      // PO-linked: keep the ordered (paid) quantity within the PO line's outstanding amount. Lowering
      // it below what's already distributed across lines is allowed — the item just shows unbalanced
      // until the operator removes lines.
      if (item.poOrderedQuantity != null) {
        this.validateQuantityAgainstPoRemaining(
          data.orderedQty,
          Number(item.poOrderedQuantity),
          Number(item.poReceivedQuantity ?? 0),
        );
      }
    }
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

    // Recompute free_qty + total_qty whenever ordered qty or any scheme field changes. free_qty is
    // always derived from the (possibly updated) ordered qty and scheme — never an operator input.
    const schemeOrQtyChanged =
      data.orderedQty !== undefined ||
      data.schemeBuyQty !== undefined ||
      data.schemeFreeQty !== undefined ||
      data.hasScheme !== undefined;
    if (schemeOrQtyChanged) {
      const orderedQty = data.orderedQty ?? Number(item.orderedQty);
      const scheme: FreeScheme = {
        buyQty: data.schemeBuyQty ?? item.schemeBuyQty ?? null,
        freeQty: data.schemeFreeQty ?? item.schemeFreeQty ?? null,
        hasScheme: data.hasScheme ?? item.hasScheme ?? false,
      };
      const freeQty = computeFreeQty(orderedQty, scheme.buyQty, scheme.freeQty, scheme.hasScheme);
      update.orderedQty = orderedQty;
      update.freeQty = freeQty;
      update.totalQty = orderedQty + freeQty;
      update.schemeBuyQty = scheme.buyQty;
      update.schemeFreeQty = scheme.freeQty;
      update.hasScheme = scheme.hasScheme;
    }

    // Recompute the effective unit cost whenever the price, ordered qty, or scheme changed.
    if (data.unitPrice !== undefined || schemeOrQtyChanged) {
      const finalUnitPrice =
        data.unitPrice !== undefined
          ? data.unitPrice
          : item.unitPrice != null
            ? BigInt(item.unitPrice as unknown as string)
            : null;
      const finalOrderedQty = (update.orderedQty as number | undefined) ?? Number(item.orderedQty);
      const finalTotalQty = (update.totalQty as number | undefined) ?? Number(item.totalQty);
      update.unitCost = this.computeUnitCost(finalUnitPrice, finalOrderedQty, finalTotalQty);
    }

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

  private validateOrderedQty(orderedQty: number) {
    if (!Number.isFinite(orderedQty) || orderedQty <= 0) {
      throw new ValidationException({
        detail: 'Ordered quantity must be greater than 0.',
        errors: [{ field: 'orderedQty', message: 'Ordered quantity must be greater than 0.' }],
      });
    }
  }

  private validateQuantityAgainstPoRemaining(quantity: number, poOrderedQuantity: number, poReceivedQuantity: number) {
    const remaining = poOrderedQuantity - poReceivedQuantity;
    if (quantity > remaining + 1e-9) {
      throw new ValidationException({
        detail: `Quantity ${quantity} exceeds the remaining PO quantity ${remaining}.`,
        errors: [{ field: 'quantity', message: 'Exceeds the remaining PO quantity.' }],
      });
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
