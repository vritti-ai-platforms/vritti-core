import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc } from '@vritti/api-sdk/drizzle-orm';
import { type CurrencyCode, majorToMinor } from '@vritti/api-sdk/money';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { convertMinor } from '@/common/convert-minor';
import { computeFreeQty } from '@/common/free-qty';
import { inventoryItems, type PurchaseOrder, purchaseOrderItems } from '@/db/schema';
import { PurchaseOrderItemDto } from '../dto/entity/purchase-order-item.dto';
import type { AddPurchaseOrderItemDto } from '../dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '../dto/request/update-purchase-order-item.dto';
import {
  type LinedPurchaseOrder,
  type PricedPurchaseOrder,
  type PurchaseOrderItemRow,
  PurchaseOrderItemsDomainRepository,
} from '../repositories/purchase-order-items.repository';

export type PurchaseOrderLinesContext = LinedPurchaseOrder &
  PricedPurchaseOrder &
  Pick<PurchaseOrder, 'id' | 'orderDate' | 'taxDate'>;

export interface FreeGoodsScheme {
  buyQty: number | null;
  freeQty: number | null;
  hasScheme: boolean;
}

export interface NewPurchaseOrderLine {
  inventoryItemId: string;
  uomId: string;
  expectedDeliveryDate: string;
  primaryUomQty: number;
  scheme: FreeGoodsScheme;
  supplierCurrencies: string[];
}

export interface ChangedPurchaseOrderLine {
  primaryUomQty: number;
  scheme: FreeGoodsScheme;
  supplierCurrencies: string[];
}

@Injectable()
export class PurchaseOrderItemsDomainService {
  private readonly logger = new Logger(PurchaseOrderItemsDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    inventoryItemName: { column: inventoryItems.name, type: 'string' },
  };
  private static readonly FIELD_MAP: FieldMap = {
    ...PurchaseOrderItemsDomainService.SEARCH_FIELD_MAP,
    inventoryItemId: { column: purchaseOrderItems.inventoryItemId, type: 'string' },
    expectedDeliveryDate: { column: purchaseOrderItems.expectedDeliveryDate, type: 'string' },
    taxDate: { column: purchaseOrderItems.taxDate, type: 'string' },
    uomQty: { column: purchaseOrderItems.uomQty, type: 'number' },
    receivedQty: { column: purchaseOrderItems.receivedQuantity, type: 'number' },
    unitPrice: { column: purchaseOrderItems.unitPrice, type: 'number' },
    totalPrice: { column: purchaseOrderItems.totalPrice, type: 'number' },
  };

  constructor(private readonly repository: PurchaseOrderItemsDomainRepository) {}

  // Returns the lines of one PO as select options
  findForSelectByPurchaseOrder(purchaseOrderId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectByPurchaseOrder(purchaseOrderId, {
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
    });
  }

  // Returns every line of a PO
  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItemDto[]> {
    const rows = await this.repository.findByPurchaseOrderId(purchaseOrderId);
    return rows.map(PurchaseOrderItemDto.from);
  }

  // Returns the inventory items ordered on a PO
  findInventoryItemIds(purchaseOrderId: string): Promise<string[]> {
    return this.repository.findInventoryItemIds(purchaseOrderId);
  }

  // Returns one page of a PO's lines
  async findForTable(
    purchaseOrderId: string,
    state: TableState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrderItemsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(purchaseOrderId, {
      where: and(
        FilterProcessor.buildWhere(state.filters, PurchaseOrderItemsDomainService.FIELD_MAP),
        FilterProcessor.buildSearch(state.search, PurchaseOrderItemsDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [asc(inventoryItems.name)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseOrderItemDto.from), count };
  }

  // Adds a line priced in the PO currency, converting another quoted currency at the PO's rate for it
  async addItem(
    po: PurchaseOrderLinesContext,
    dto: AddPurchaseOrderItemDto,
    line: NewPurchaseOrderLine,
  ): Promise<void> {
    this.repository.assertLinesEditable(po);
    this.repository.assertDeliveryNotBeforeOrder(po, line.expectedDeliveryDate);
    await this.repository.assertNotOnPurchaseOrder(po.id, line, 'supplierItemId');

    const quotedCurrency = dto.unitPrice.currency;
    const quotedPrice = majorToMinor(dto.unitPrice.value, quotedCurrency as CurrencyCode, 'unitPrice');
    const isQuotedInPoCurrency = quotedCurrency === po.currencyCode;
    const unitPrice = isQuotedInPoCurrency
      ? quotedPrice
      : convertMinor(
          quotedPrice,
          quotedCurrency,
          po.currencyCode,
          this.repository.conversionRateOrThrow(po, quotedCurrency, line.supplierCurrencies),
        );
    const totalPrice = new Decimal(unitPrice.toString()).times(dto.uomQty).toDecimalPlaces(0);

    await this.repository.create({
      purchaseOrderId: po.id,
      inventoryItemId: line.inventoryItemId,
      expectedDeliveryDate: line.expectedDeliveryDate,
      taxDate: po.taxDate,
      isTaxDateOverridden: false,
      uomId: line.uomId,
      uomQty: dto.uomQty,
      primaryUomQty: line.primaryUomQty,
      unitPrice,
      totalPrice: BigInt(totalPrice.toFixed(0)),
      primaryUomUnitPrice: BigInt(totalPrice.dividedBy(line.primaryUomQty).toFixed(0)),
      currencyCode: po.currencyCode,
      sourceCurrencyCode: isQuotedInPoCurrency ? null : quotedCurrency,
      sourceUnitPrice: isQuotedInPoCurrency ? null : quotedPrice,
      schemeBuyQty: line.scheme.buyQty,
      schemeFreeQty: line.scheme.freeQty,
      hasScheme: line.scheme.hasScheme,
      freeQty: computeFreeQty(dto.uomQty, line.scheme.buyQty, line.scheme.freeQty, line.scheme.hasScheme),
    });
    this.logger.log(`Added item ${line.inventoryItemId} to PO ${po.poNumber}`);
  }

  // Updates a line's item, quantity, price, scheme, expected delivery or tax date, pricing it again in the PO currency
  async updateItem(
    po: PurchaseOrderLinesContext,
    dto: UpdatePurchaseOrderItemDto,
    line: ChangedPurchaseOrderLine,
  ): Promise<SuccessResponseDto> {
    this.repository.assertLinesEditable(po);
    this.repository.assertSingleTaxDateChange(dto);
    const item = await this.repository.findDetailOnPurchaseOrderOrThrow(po.id, dto.itemId);
    if (dto.expectedDeliveryDate !== undefined) {
      this.repository.assertDeliveryDateEditable(item);
      this.repository.assertDeliveryNotBeforeOrder(po, dto.expectedDeliveryDate);
    }
    const isTaxDateChanged = dto.taxDate !== undefined || dto.followPoTaxDate === true;
    if (isTaxDateChanged) this.repository.assertTaxDateUnlocked(item);
    const inventoryItemId = dto.inventoryItemId ?? item.inventoryItemId;
    if (inventoryItemId !== item.inventoryItemId) {
      await this.repository.assertNotOnGoodsReceipt(item.id, 'Cannot Change Item');
      await this.repository.assertNotOnPurchaseOrder(
        po.id,
        { inventoryItemId, uomId: item.uomId },
        'inventoryItemId',
        item.id,
      );
    }

    const uomQty = dto.uomQty ?? item.uomQty;
    const quotedCurrency = dto.unitPrice?.currency ?? item.sourceCurrencyCode ?? po.currencyCode;
    const quotedPrice = dto.unitPrice
      ? majorToMinor(dto.unitPrice.value, quotedCurrency as CurrencyCode, 'unitPrice')
      : (item.sourceUnitPrice ?? item.unitPrice);
    const isQuotedInPoCurrency = quotedCurrency === po.currencyCode;
    const unitPrice = isQuotedInPoCurrency
      ? quotedPrice
      : convertMinor(
          quotedPrice,
          quotedCurrency,
          po.currencyCode,
          this.repository.conversionRateOrThrow(po, quotedCurrency, line.supplierCurrencies),
        );
    const totalPrice = new Decimal(unitPrice.toString()).times(uomQty).toDecimalPlaces(0);

    await this.repository.update(item.id, {
      inventoryItemId,
      expectedDeliveryDate: dto.expectedDeliveryDate ?? item.expectedDeliveryDate,
      taxDate: dto.followPoTaxDate ? po.taxDate : (dto.taxDate ?? item.taxDate),
      isTaxDateOverridden: isTaxDateChanged ? !dto.followPoTaxDate : item.isTaxDateOverridden,
      uomQty,
      primaryUomQty: line.primaryUomQty,
      unitPrice,
      totalPrice: BigInt(totalPrice.toFixed(0)),
      primaryUomUnitPrice: BigInt(totalPrice.dividedBy(line.primaryUomQty).toFixed(0)),
      sourceCurrencyCode: isQuotedInPoCurrency ? null : quotedCurrency,
      sourceUnitPrice: isQuotedInPoCurrency ? null : quotedPrice,
      schemeBuyQty: line.scheme.buyQty,
      schemeFreeQty: line.scheme.freeQty,
      hasScheme: line.scheme.hasScheme,
      freeQty: computeFreeQty(uomQty, line.scheme.buyQty, line.scheme.freeQty, line.scheme.hasScheme),
    });
    this.logger.log(`Updated item ${item.id} on PO ${po.poNumber}`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  // Moves every line that follows the PO's tax date to its new one, unless a receipt or an invoice locks one of them
  async followPoTaxDate(purchaseOrderId: string, taxDate: string): Promise<number> {
    await this.repository.assertFollowersUnlocked(purchaseOrderId);
    return this.repository.setFollowersTaxDate(purchaseOrderId, taxDate);
  }

  // Removes a line that no goods receipt counts goods against
  async removeItem(po: PurchaseOrderLinesContext, itemId: string): Promise<SuccessResponseDto> {
    this.repository.assertLinesEditable(po);
    const item = await this.repository.findOnPurchaseOrderOrThrow(po.id, itemId);
    await this.repository.assertNotOnGoodsReceipt(item.id, 'Cannot Remove Item');

    await this.repository.delete(item.id);
    this.logger.log(`Removed item ${item.id} from PO ${po.poNumber}`);
    return { success: true, message: `Line item removed from purchase order "${po.poNumber}".` };
  }

  // Converts every line quoted in `currencyCode` again at its new rate; the caller stores the rate and syncs the total
  async repriceSourceCurrency(po: PurchaseOrderLinesContext, currencyCode: string, rate: string): Promise<number> {
    this.repository.assertLinesEditable(po);
    const lines = await this.repository.findByPurchaseOrderId(po.id);
    const quotedInCurrency = lines.filter(
      (line): line is PurchaseOrderItemRow & { sourceUnitPrice: bigint } =>
        line.sourceCurrencyCode === currencyCode && line.sourceUnitPrice !== null,
    );

    for (const line of quotedInCurrency) {
      const unitPrice = convertMinor(line.sourceUnitPrice, currencyCode, po.currencyCode, rate);
      const totalPrice = new Decimal(unitPrice.toString()).times(line.uomQty).toDecimalPlaces(0);
      await this.repository.update(line.id, {
        unitPrice,
        totalPrice: BigInt(totalPrice.toFixed(0)),
        primaryUomUnitPrice: BigInt(totalPrice.dividedBy(line.primaryUomQty).toFixed(0)),
      });
    }
    return quotedInCurrency.length;
  }
}
