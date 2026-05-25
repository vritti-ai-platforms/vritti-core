import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues, purchaseOrderItems } from '@/db/schema';
import type { AddPurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@/modules/purchase-orders/dto/request/update-purchase-order-item.dto';
import { PurchaseOrderItemDto } from '../dto/entity/purchase-order-item.dto';
import { PurchaseOrderItemsRepository } from '../repositories/purchase-order-items.repository';

export interface PurchaseOrderContext {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  supplierId: string;
  supplierName: string | null;
}

@Injectable()
export class PurchaseOrderItemsService {
  private readonly logger = new Logger(PurchaseOrderItemsService.name);

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    inventoryItemId: { column: purchaseOrderItems.inventoryItemId, type: 'string' },
    uomQty: { column: purchaseOrderItems.uomQty, type: 'number' },
    receivedQuantity: { column: purchaseOrderItems.receivedQuantity, type: 'number' },
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(private readonly repository: PurchaseOrderItemsRepository) {}

  // Returns all line items for a PO
  async findByPoId(poId: string): Promise<PurchaseOrderItemDto[]> {
    const items = await this.repository.findItemsByPoId(poId);
    return items.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName));
  }

  // Returns inventory item IDs for a PO
  findIdsByPoId(poId: string): Promise<string[]> {
    return this.repository.findInventoryItemIdsByPoId(poId);
  }

  // Returns paginated line items for a PO table
  async findForTable(
    poId: string,
    state: TableViewState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PurchaseOrderItemsService.ITEM_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PurchaseOrderItemsService.ITEM_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrderItemsService.ITEM_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForTable(poId, {
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrderItems.inventoryItemId)],
      limit,
      offset,
    });

    return {
      result: result.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName)),
      count,
    };
  }

  // Adds a line item to a draft PO. Does not call syncTotalAmount — that is the app-layer's responsibility.
  async addItem(
    po: PurchaseOrderContext,
    data: AddPurchaseOrderItemDto,
    inventoryItemId: string,
    uomId: string,
    primaryUomQty: number,
  ): Promise<void> {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const duplicate = await this.repository.findItemByInventoryItemAndUom(po.id, inventoryItemId, uomId);
    if (duplicate) {
      throw new BadRequestException({
        label: 'Duplicate Item',
        detail: 'This inventory item with the same UOM is already added to the purchase order.',
      });
    }

    const poCode = po.currencyCode as CurrencyCode;

    if (data.unitPrice.currency !== poCode) {
      throw new BadRequestException({
        label: 'Currency Mismatch',
        detail: `unitPrice.currency must be ${poCode}.`,
      });
    }

    let unitPriceMinor: bigint;
    try {
      unitPriceMinor = majorToMinor(data.unitPrice.value, poCode);
    } catch (e) {
      throw new BadRequestException({
        label: 'Invalid Price',
        detail: e instanceof Error ? e.message : 'Invalid price value.',
      });
    }

    const totalPriceMinor = BigInt(Math.round(Number(unitPriceMinor) * data.uomQty));

    // Price per primary UOM unit = totalPrice / primaryUomQty (minor units ÷ decimal qty → minor units).
    const primaryUomUnitPriceMinor = BigInt(
      new Decimal(totalPriceMinor.toString())
        .dividedBy(primaryUomQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber(),
    );

    await this.repository.create({
      purchaseOrderId: po.id,
      inventoryItemId,
      uomId,
      uomQty: String(data.uomQty),
      primaryUomQty: String(primaryUomQty),
      primaryUomUnitPrice: primaryUomUnitPriceMinor,
      unitPrice: unitPriceMinor,
      totalPrice: totalPriceMinor,
      currencyCode: po.currencyCode,
    });

    this.logger.log(`Added item to PO ${po.poNumber} (${po.id})`);
  }

  // Updates a line item on a draft PO. Does not call syncTotalAmount — that is the app-layer's responsibility.
  // `primaryUomQty` must already be computed for the effective ordered quantity (data.uomQty ?? existing).
  async updateItem(
    po: PurchaseOrderContext,
    itemId: string,
    data: UpdatePurchaseOrderItemDto,
    primaryUomQty: number,
  ): Promise<SuccessResponseDto> {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const item = await this.repository.findItemById(po.id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    if (data.inventoryItemId && data.inventoryItemId !== item.inventoryItemId) {
      const duplicate = await this.repository.findItemByInventoryItemAndUom(po.id, data.inventoryItemId, item.uomId);
      if (duplicate) {
        throw new BadRequestException({
          label: 'Duplicate Item',
          detail: 'This inventory item with the same UOM is already added to the purchase order.',
        });
      }
    }

    const poCode = po.currencyCode as CurrencyCode;
    const orderedQuantity = data.uomQty ?? Number(item.uomQty);

    let unitPriceMinor: bigint;
    try {
      if (data.unitPrice != null) {
        if (data.unitPrice.currency !== poCode) {
          throw new BadRequestException({
            label: 'Currency Mismatch',
            detail: `unitPrice.currency must be ${poCode}.`,
          });
        }
        unitPriceMinor = majorToMinor(data.unitPrice.value, poCode);
      } else {
        unitPriceMinor = item.unitPrice;
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException({
        label: 'Invalid Price',
        detail: e instanceof Error ? e.message : 'Invalid price value.',
      });
    }

    const totalPriceMinor = BigInt(Math.round(Number(unitPriceMinor) * orderedQuantity));

    const primaryUomUnitPriceMinor = BigInt(
      new Decimal(totalPriceMinor.toString())
        .dividedBy(primaryUomQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber(),
    );

    await this.repository.update(itemId, {
      inventoryItemId: data.inventoryItemId,
      uomQty: String(orderedQuantity),
      primaryUomQty: String(primaryUomQty),
      primaryUomUnitPrice: primaryUomUnitPriceMinor,
      unitPrice: unitPriceMinor,
      totalPrice: totalPriceMinor,
    });

    this.logger.log(`Updated item ${itemId} on PO ${po.poNumber}`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  // Removes a line item from a draft PO. Does not call syncTotalAmount — that is the app-layer's responsibility.
  async removeItem(po: PurchaseOrderContext, itemId: string): Promise<SuccessResponseDto> {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const item = await this.repository.findItemById(po.id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    await this.repository.delete(itemId);
    this.logger.log(`Removed item ${itemId} from PO ${po.poNumber}`);
    return { success: true, message: `Line item removed from purchase order "${po.poNumber}".` };
  }
}
