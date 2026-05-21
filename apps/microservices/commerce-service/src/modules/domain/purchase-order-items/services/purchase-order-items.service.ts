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
import { type CurrencyCode, majorToMinor, resolveCurrency } from '@vritti/api-sdk/money';
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
  conversionRate: string;
  supplierId: string;
  supplierName: string | null;
  supplierCurrencyCode: string | null;
}

@Injectable()
export class PurchaseOrderItemsService {
  private readonly logger = new Logger(PurchaseOrderItemsService.name);

  private static readonly ITEM_FIELD_MAP: FieldMap = {
    inventoryItemId: { column: purchaseOrderItems.inventoryItemId, type: 'string' },
    quantity: { column: purchaseOrderItems.quantity, type: 'number' },
    receivedQuantity: { column: purchaseOrderItems.receivedQuantity, type: 'number' },
    supplierUnitPrice: { column: purchaseOrderItems.supplierUnitPrice, type: 'number' },
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(private readonly repository: PurchaseOrderItemsRepository) {}

  // Returns all line items for a PO
  async findByPoId(poId: string, poCurrencyCode: string, supplierCurrencyCode?: string | null): Promise<PurchaseOrderItemDto[]> {
    const items = await this.repository.findItemsByPoId(poId);
    return items.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName, poCurrencyCode, supplierCurrencyCode));
  }

  // Returns inventory item IDs for a PO
  findIdsByPoId(poId: string): Promise<string[]> {
    return this.repository.findItemIdsByPoId(poId);
  }

  // Returns paginated line items for a PO table
  async findForTable(
    poId: string,
    state: TableViewState,
    poCurrencyCode: string,
    supplierCurrencyCode?: string | null,
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
      result: result.map((item) => PurchaseOrderItemDto.from(item, item.inventoryItemName, poCurrencyCode, supplierCurrencyCode)),
      count,
    };
  }

  // Adds a line item to a draft PO. Does not call syncTotalAmount — that is the app-layer's responsibility.
  async addItem(po: PurchaseOrderContext, data: AddPurchaseOrderItemDto, uomId: string, conversionFactor: number): Promise<void> {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const duplicate = await this.repository.findItemByInventoryItemId(po.id, data.inventoryItemId);
    if (duplicate) {
      throw new BadRequestException({
        label: 'Duplicate Item',
        detail: 'This inventory item is already added to the purchase order.',
      });
    }

    const supplierCode = (po.supplierCurrencyCode ?? po.currencyCode) as CurrencyCode;
    const poCode = po.currencyCode as CurrencyCode;

    if (data.supplierUnitPrice.currency !== supplierCode) {
      throw new BadRequestException({
        label: 'Currency Mismatch',
        detail: `supplierUnitPrice.currency must be ${supplierCode}.`,
      });
    }

    if (data.unitPrice && data.unitPrice.currency !== poCode) {
      throw new BadRequestException({
        label: 'Currency Mismatch',
        detail: `unitPrice.currency must be ${poCode}.`,
      });
    }

    const itemConversionRate = Number(po.conversionRate);

    let supplierUnitPriceMinor: bigint;
    let unitPriceMinor: bigint;

    try {
      supplierUnitPriceMinor = majorToMinor(data.supplierUnitPrice.value, supplierCode);

      if (data.unitPrice != null) {
        unitPriceMinor = majorToMinor(data.unitPrice.value, poCode);
      } else {
        // Cross-currency scale: supplier_minor × rate × 10^poExp / 10^itemExp
        const itemExp = Number(resolveCurrency(supplierCode).exponent);
        const poExp = Number(resolveCurrency(poCode).exponent);
        const unitPriceNum = (Number(supplierUnitPriceMinor) * itemConversionRate * 10 ** poExp) / 10 ** itemExp;
        unitPriceMinor = BigInt(Math.round(unitPriceNum));
      }
    } catch (e) {
      throw new BadRequestException({
        label: 'Invalid Price',
        detail: e instanceof Error ? e.message : 'Invalid price value.',
      });
    }

    const totalPriceMinor = BigInt(Math.round(Number(unitPriceMinor) * data.quantity));

    const primaryUomUnitPriceMinor = BigInt(
      new Decimal(Number(unitPriceMinor)).dividedBy(conversionFactor).toDecimalPlaces(0).toNumber(),
    );

    await this.repository.create({
      purchaseOrderId: po.id,
      inventoryItemId: data.inventoryItemId,
      uomId,
      quantity: String(data.quantity),
      conversionFactor: String(conversionFactor),
      primaryUomUnitPrice: primaryUomUnitPriceMinor,
      supplierUnitPrice: supplierUnitPriceMinor,
      unitPrice: unitPriceMinor,
      totalPrice: totalPriceMinor,
    });

    this.logger.log(`Added item to PO ${po.poNumber} (${po.id})`);
  }

  // Updates a line item on a draft PO. Does not call syncTotalAmount — that is the app-layer's responsibility.
  async updateItem(
    po: PurchaseOrderContext,
    itemId: string,
    data: UpdatePurchaseOrderItemDto,
    conversionFactor: number,
  ): Promise<SuccessResponseDto> {
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Edit Items', detail: 'Line items can only be changed in draft.' });
    }

    const item = await this.repository.findItemById(po.id, itemId);
    if (!item) throw new NotFoundException('Purchase order line item not found.');

    if (data.inventoryItemId && data.inventoryItemId !== item.inventoryItemId) {
      const duplicate = await this.repository.findItemByInventoryItemId(po.id, data.inventoryItemId);
      if (duplicate) {
        throw new BadRequestException({
          label: 'Duplicate Item',
          detail: 'This inventory item is already added to the purchase order.',
        });
      }
    }

    const supplierCode = (po.supplierCurrencyCode ?? po.currencyCode) as CurrencyCode;
    const poCode = po.currencyCode as CurrencyCode;
    const conversionRate = Number(po.conversionRate);

    const orderedQuantity = data.quantity ?? Number(item.quantity);

    let supplierUnitPriceMinor: bigint;
    let unitPriceMinor: bigint;

    try {
      if (data.supplierUnitPrice !== undefined) {
        if (data.supplierUnitPrice.currency !== supplierCode) {
          throw new BadRequestException({
            label: 'Currency Mismatch',
            detail: `supplierUnitPrice.currency must be ${supplierCode}.`,
          });
        }
        supplierUnitPriceMinor = majorToMinor(data.supplierUnitPrice.value, supplierCode);
      } else {
        supplierUnitPriceMinor = item.supplierUnitPrice;
      }

      if (data.unitPrice != null) {
        if (data.unitPrice.currency !== poCode) {
          throw new BadRequestException({
            label: 'Currency Mismatch',
            detail: `unitPrice.currency must be ${poCode}.`,
          });
        }
        unitPriceMinor = majorToMinor(data.unitPrice.value, poCode);
      } else if (data.unitPrice === null) {
        // Explicitly cleared — derive from supplier price using item's conversion rate
        const itemExp = Number(resolveCurrency(supplierCode).exponent);
        const poExp = Number(resolveCurrency(poCode).exponent);
        const unitPriceNum = (Number(supplierUnitPriceMinor) * conversionRate * 10 ** poExp) / 10 ** itemExp;
        unitPriceMinor = BigInt(Math.round(unitPriceNum));
      } else {
        unitPriceMinor = item.unitPrice != null ? item.unitPrice : supplierUnitPriceMinor;
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
      new Decimal(Number(unitPriceMinor)).dividedBy(conversionFactor).toDecimalPlaces(0).toNumber(),
    );

    await this.repository.update(itemId, {
      inventoryItemId: data.inventoryItemId,
      quantity: String(orderedQuantity),
      conversionFactor: String(conversionFactor),
      primaryUomUnitPrice: primaryUomUnitPriceMinor,
      supplierUnitPrice: supplierUnitPriceMinor,
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

  // Recalculates unit and total prices for all items on a PO when the header currency or rate changes.
  // Called by the app-layer root service inside a transaction — does not call syncTotalAmount.
  async recalculateForCurrencyChange(
    poId: string,
    newCurrencyCode: string,
    newConversionRate: number,
    supplierCurrencyCode: string,
  ): Promise<void> {
    const newCurrencyCodeTyped = newCurrencyCode as CurrencyCode;
    const supplierCode = supplierCurrencyCode as CurrencyCode;
    const poExp = Number(resolveCurrency(newCurrencyCodeTyped).exponent);
    const itemExp = Number(resolveCurrency(supplierCode).exponent);
    const scaleFactor = 10 ** poExp / 10 ** itemExp;
    await this.repository.recalculateAllForPo(poId, newConversionRate, scaleFactor);
  }
}
