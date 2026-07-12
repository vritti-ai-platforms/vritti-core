import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import { computeFreeQty } from '@/common/free-qty';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues, purchaseOrderItems } from '@/db/schema';

export type FreeScheme = { buyQty: number | null; freeQty: number | null; hasScheme: boolean };

import type { AddPurchaseOrderItemDto } from '@/modules/site/purchase-orders/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@/modules/site/purchase-orders/dto/request/update-purchase-order-item.dto';
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

  private static readonly EDITABLE_STATUSES: PurchaseOrderStatus[] = [
    PurchaseOrderStatusValues.DRAFT,
    PurchaseOrderStatusValues.SENT,
    PurchaseOrderStatusValues.CONFIRMED,
    PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
  ];

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    inventoryItemId: { column: purchaseOrderItems.inventoryItemId, type: 'string' },
    uomQty: { column: purchaseOrderItems.uomQty, type: 'number' },
    receivedQuantity: { column: purchaseOrderItems.receivedQuantity, type: 'number' },
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(private readonly repository: PurchaseOrderItemsRepository) {}

  // Returns paginated PO line options for the GR AddItem selector
  findForSelectByPo(
    poId: string,
    query: SelectOptionsQueryDto,
    options?: { excludeOnGoodsReceiptId?: string },
  ): Promise<SelectQueryResult> {
    return this.repository.findForSelectByPo(
      poId,
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

  private assertEditable(po: PurchaseOrderContext): void {
    if (!PurchaseOrderItemsService.EDITABLE_STATUSES.includes(po.status)) {
      throw new BadRequestException({
        label: 'Cannot Edit Items',
        detail: 'Line items cannot be changed once the purchase order is received, closed, or cancelled.',
      });
    }
  }

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
  async findForTable(poId: string, state: TableViewState): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
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

  // Adds a line item to a PO that is in an editable status
  async addItem(
    po: PurchaseOrderContext,
    data: AddPurchaseOrderItemDto,
    inventoryItemId: string,
    uomId: string,
    primaryUomQty: number,
    scheme: FreeScheme,
  ): Promise<void> {
    this.assertEditable(po);

    const duplicate = await this.repository.findItemByInventoryItemAndUom(po.id, inventoryItemId, uomId);
    if (duplicate) {
      throw new ValidationException({
        detail: 'This supplier item is already on the purchase order.',
        errors: [{ field: 'supplierItemId', message: 'This supplier item is already on the purchase order.' }],
      });
    }

    const poCode = po.currencyCode as CurrencyCode;

    if (data.unitPrice.currency !== poCode) {
      throw new ValidationException({
        detail: `Unit price currency must match the purchase order currency (${poCode}).`,
        errors: [{ field: 'unitPrice', message: `Must be in ${poCode}.` }],
      });
    }

    const unitPriceMinor = majorToMinor(data.unitPrice.value, poCode, 'unitPrice');

    const totalPriceMinor = BigInt(
      new Decimal(unitPriceMinor.toString()).times(data.uomQty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );

    // Price per primary UOM unit = totalPrice / primaryUomQty (minor units ÷ decimal qty → minor units).
    const primaryUomUnitPriceMinor = BigInt(
      new Decimal(totalPriceMinor.toString())
        .dividedBy(primaryUomQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );

    const freeQty = computeFreeQty(data.uomQty, scheme.buyQty, scheme.freeQty, scheme.hasScheme);

    await this.repository.create({
      purchaseOrderId: po.id,
      inventoryItemId,
      uomId,
      uomQty: data.uomQty,
      primaryUomQty,
      primaryUomUnitPrice: primaryUomUnitPriceMinor,
      unitPrice: unitPriceMinor,
      totalPrice: totalPriceMinor,
      currencyCode: po.currencyCode,
      schemeBuyQty: scheme.buyQty,
      schemeFreeQty: scheme.freeQty,
      hasScheme: scheme.hasScheme,
      freeQty,
    });

    this.logger.log(`Added item to PO ${po.poNumber} (${po.id})`);
  }

  // Updates a line item on a PO that is in an editable status
  async updateItem(
    po: PurchaseOrderContext,
    itemId: string,
    data: UpdatePurchaseOrderItemDto,
    primaryUomQty: number,
    scheme: FreeScheme,
  ): Promise<SuccessResponseDto> {
    this.assertEditable(po);

    const item = await this.repository.findItemById(po.id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    const isReceived = item.receivedQuantity > 0;

    if (data.inventoryItemId && data.inventoryItemId !== item.inventoryItemId) {
      if (isReceived) {
        throw new BadRequestException({
          label: 'Cannot Change Item',
          detail: 'Inventory item cannot be changed once goods have been received against this line.',
        });
      }
      const duplicate = await this.repository.findItemByInventoryItemAndUom(po.id, data.inventoryItemId, item.uomId);
      if (duplicate) {
        throw new ValidationException({
          detail: 'This inventory item with the same UOM is already added to the purchase order.',
          errors: [{ field: 'uomId', message: 'This unit is already on the purchase order for this item.' }],
        });
      }
    }

    const poCode = po.currencyCode as CurrencyCode;
    const orderedQuantity = data.uomQty ?? item.uomQty;

    if (isReceived && orderedQuantity < item.receivedQuantity) {
      throw new ValidationException({
        detail: `Quantity cannot be less than the received quantity (${item.receivedQuantity}).`,
        errors: [{ field: 'uomQty', message: `Cannot be less than received quantity (${item.receivedQuantity}).` }],
      });
    }

    let unitPriceMinor: bigint;
    if (data.unitPrice != null) {
      if (data.unitPrice.currency !== poCode) {
        throw new ValidationException({
          detail: `Unit price currency must match the purchase order currency (${poCode}).`,
          errors: [{ field: 'unitPrice', message: `Must be in ${poCode}.` }],
        });
      }
      unitPriceMinor = majorToMinor(data.unitPrice.value, poCode, 'unitPrice');
    } else {
      unitPriceMinor = item.unitPrice;
    }

    const totalPriceMinor = BigInt(
      new Decimal(unitPriceMinor.toString())
        .times(orderedQuantity)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );

    const primaryUomUnitPriceMinor = BigInt(
      new Decimal(totalPriceMinor.toString())
        .dividedBy(primaryUomQty)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toFixed(0),
    );

    const freeQty = computeFreeQty(orderedQuantity, scheme.buyQty, scheme.freeQty, scheme.hasScheme);

    await this.repository.update(itemId, {
      inventoryItemId: data.inventoryItemId,
      uomQty: orderedQuantity,
      primaryUomQty,
      primaryUomUnitPrice: primaryUomUnitPriceMinor,
      unitPrice: unitPriceMinor,
      totalPrice: totalPriceMinor,
      schemeBuyQty: scheme.buyQty,
      schemeFreeQty: scheme.freeQty,
      hasScheme: scheme.hasScheme,
      freeQty,
    });

    this.logger.log(`Updated item ${itemId} on PO ${po.poNumber}`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  // Removes a line item from a PO when it is editable and not yet received against
  async removeItem(po: PurchaseOrderContext, itemId: string): Promise<SuccessResponseDto> {
    this.assertEditable(po);

    const item = await this.repository.findItemById(po.id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    if (item.receivedQuantity > 0) {
      throw new BadRequestException({
        label: 'Cannot Remove Item',
        detail: 'Line items cannot be removed once goods have been received against them.',
      });
    }

    await this.repository.delete(itemId);
    this.logger.log(`Removed item ${itemId} from PO ${po.poNumber}`);
    return { success: true, message: `Line item removed from purchase order "${po.poNumber}".` };
  }
}
