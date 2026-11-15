import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { convertMinor } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { GoodsReceiptStatusValues, goodsReceiptItems, inventoryItems } from '@/db/schema';
import { GoodsReceiptItemDto } from '../dto/entity/goods-receipt-item.dto';
import { GoodsReceiptItemsCostDto } from '../dto/entity/goods-receipt-items-cost.dto';
import type { GoodsReceiptTreeNode } from '../dto/entity/goods-receipt-tree.dto';
import { PurchaseOrderReceiptItemFlagsDto } from '../dto/entity/purchase-order-receipt-item-flags.dto';
import type { UpdateGoodsReceiptItemDto } from '../dto/request/update-goods-receipt-item.dto';
import {
  type GoodsReceiptItemContext,
  type GoodsReceiptItemRow,
  GoodsReceiptItemsDomainRepository,
} from '../repositories/goods-receipt-items.repository';
import type { GoodsReceiptRow } from '../repositories/goods-receipts.repository';

export interface GoodsReceiptItemCost {
  item: GoodsReceiptItemRow;
  acceptedQty: number;
  acceptedPrimaryQty: number;
  unitCost: bigint;
  value: bigint;
}

@Injectable()
export class GoodsReceiptItemsDomainService {
  private readonly logger = new Logger(GoodsReceiptItemsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
  };
  private static readonly FIELD_MAP: FieldMap = {
    ...GoodsReceiptItemsDomainService.SEARCH_FIELD_MAP,
    receivedQty: { column: goodsReceiptItems.receivedQty, type: 'number' },
    rejectedQuantity: { column: goodsReceiptItems.rejectedQuantity, type: 'number' },
  };

  constructor(private readonly itemsRepository: GoodsReceiptItemsDomainRepository) {}

  // Changes the received or rejected quantity of an item on a draft receipt, in primary units too by its PO line's ratio
  async updateItem(
    receipt: GoodsReceiptRow,
    item: GoodsReceiptItemRow,
    dto: UpdateGoodsReceiptItemDto,
  ): Promise<SuccessResponseDto> {
    const receivedQty = dto.receivedQty ?? item.receivedQty;
    const rejectedQuantity = dto.rejectedQuantity ?? item.rejectedQuantity;
    this.assertRejectedWithinReceived(receivedQty, rejectedQuantity);
    const primaryPerOrderUnit = new Decimal(item.poPrimaryUomQty).dividedBy(item.orderedQty);

    await this.itemsRepository.update(item.id, {
      receivedQty,
      rejectedQuantity,
      receivedPrimaryQty: primaryPerOrderUnit.times(receivedQty).toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber(),
      rejectedPrimaryQty: primaryPerOrderUnit
        .times(rejectedQuantity)
        .toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
        .toNumber(),
    });
    this.logger.log(`Updated item ${item.id} on goods receipt ${receipt.grNumber}`);
    return { success: true, message: `"${item.inventoryItemName}" updated on goods receipt "${receipt.grNumber}".` };
  }

  // Returns one item of a receipt with its purchase order context and flags
  async findById(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemDto> {
    return GoodsReceiptItemDto.from(await this.findOnReceiptOrThrow(goodsReceiptId, itemId));
  }

  // Returns one page of a receipt's items with their purchase order context and flags
  async findForTable(
    goodsReceiptId: string,
    state: TableState,
  ): Promise<{ result: GoodsReceiptItemDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, GoodsReceiptItemsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.itemsRepository.findForTable(goodsReceiptId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, GoodsReceiptItemsDomainService.FIELD_MAP),
        FilterProcessor.buildSearch(state.search, GoodsReceiptItemsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(goodsReceiptItems.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(GoodsReceiptItemDto.from), count };
  }

  // Loads an item of the given receipt, throwing when it is not on it
  async findOnReceiptOrThrow(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemRow> {
    const item = await this.itemsRepository.findOnReceipt(goodsReceiptId, itemId);
    if (!item) throw new NotFoundException('Goods receipt item not found.');
    return item;
  }

  // Loads what the item's lots, lines and serials are written against, throwing unless its receipt is a draft
  async findDraftContextOrThrow(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItemContext> {
    const context = await this.itemsRepository.findContext(goodsReceiptId, itemId);
    if (!context) throw new NotFoundException('Goods receipt item not found.');
    if (context.receiptStatus === GoodsReceiptStatusValues.DRAFT) return context;
    throw new BadRequestException({
      label: 'Goods Receipt Posted',
      detail: 'The goods receipt is posted, so its lots, lines and serials can no longer change.',
    });
  }

  // Returns the flagged items of a purchase order's receipts, newest receipt first, each with its receipt and flags
  async findFlaggedForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderReceiptItemFlagsDto[]> {
    const items = await this.itemsRepository.findByPurchaseOrderId(purchaseOrderId);
    return items.map(PurchaseOrderReceiptItemFlagsDto.from).filter((item) => item.flags.length > 0);
  }

  // Returns every item of a receipt with its PO line and distribution progress, in entry order
  findByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemRow[]> {
    return this.itemsRepository.findByReceiptId(goodsReceiptId);
  }

  // Returns the inventory items counted on a receipt
  findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    return this.itemsRepository.findInventoryItemIds(goodsReceiptId);
  }

  // Returns the receipt's items with their lots and lines as a tree
  findTree(goodsReceiptId: string): Promise<GoodsReceiptTreeNode[]> {
    return this.itemsRepository.findTreeByReceiptId(goodsReceiptId);
  }

  // Values each item from its PO line: the LE-currency line total over its ordered plus expected free primary units
  async findProvisionalCosts(goodsReceiptId: string, leCurrencyCode: string): Promise<GoodsReceiptItemCost[]> {
    const items = await this.itemsRepository.findByReceiptId(goodsReceiptId);
    return items.map((item) => {
      const lineTotal = new Decimal(
        convertMinor(item.poTotalPrice, item.poCurrencyCode, leCurrencyCode, item.poExchangeRate).toString(),
      );
      const expectedPrimaryQty = new Decimal(item.poPrimaryUomQty).plus(item.poFreePrimaryQty);
      const acceptedQty = new Decimal(item.receivedQty).minus(item.rejectedQuantity);
      const acceptedPrimaryQty = new Decimal(item.receivedPrimaryQty).minus(item.rejectedPrimaryQty);
      return {
        item,
        acceptedQty: acceptedQty.toNumber(),
        acceptedPrimaryQty: acceptedPrimaryQty.toNumber(),
        unitCost: BigInt(lineTotal.dividedBy(expectedPrimaryQty).toFixed(0, Decimal.ROUND_HALF_UP)),
        value: BigInt(
          lineTotal.times(acceptedPrimaryQty).dividedBy(expectedPrimaryQty).toFixed(0, Decimal.ROUND_HALF_UP),
        ),
      };
    });
  }

  // Returns the provisional cost of every item on the receipt, read-only until a supplier invoice sets the final one
  async findItemsCost(goodsReceiptId: string, leCurrencyCode: string): Promise<GoodsReceiptItemsCostDto> {
    return GoodsReceiptItemsCostDto.from(
      await this.findProvisionalCosts(goodsReceiptId, leCurrencyCode),
      leCurrencyCode,
    );
  }

  // Removes an item, with its lots and lines, from a draft receipt
  async removeItem(receipt: GoodsReceiptRow, item: GoodsReceiptItemRow): Promise<SuccessResponseDto> {
    await this.itemsRepository.delete(item.id);
    this.logger.log(`Removed item ${item.id} from goods receipt ${receipt.grNumber}`);
    return { success: true, message: `"${item.inventoryItemName}" removed from goods receipt "${receipt.grNumber}".` };
  }

  // Rejects rejecting more than was received
  private assertRejectedWithinReceived(receivedQty: number, rejectedQuantity: number): void {
    if (rejectedQuantity <= receivedQty) return;
    throw new BadRequestException({
      label: 'Too Many Rejected',
      detail: `Only ${receivedQty} were received, so no more than that can be rejected.`,
      errors: [{ field: 'rejectedQuantity', message: 'More than received' }],
    });
  }
}
