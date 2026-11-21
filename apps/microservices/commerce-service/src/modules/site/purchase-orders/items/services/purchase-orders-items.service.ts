import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import type { AddPurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/update-purchase-order-item.dto';
import {
  PurchaseOrderItemsDomainService,
  type PurchaseOrderLinesContext,
} from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderRow } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { addDays, formatISO, parseISO } from 'date-fns';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';
import type { PurchaseOrderItemDefaultsDto } from '../dto/entity/purchase-order-item-defaults.dto';
import type { PurchaseOrderItemWithDisplayDto } from '../dto/entity/purchase-order-item-with-display.dto';
import type { PurchaseOrderItemDefaultsQueryDto } from '../dto/request/purchase-order-item-defaults-query.dto';

@Injectable()
export class PurchaseOrdersItemsService {
  private readonly logger = new Logger(PurchaseOrdersItemsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly supplierItemPricesService: SupplierItemPricesDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly inventoryItemSitesRepository: InventoryItemSitesDomainRepository,
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly purchasingRulesService: PurchasingRulesService,
  ) {}

  // Orders an item the PO's site carries, in one of its units, defaulting the scheme from the price in force for the
  // supplier's item in that unit and the delivery from its lead time at the site, when the supplier has one; a site whose
  // rules buy the item only from suppliers set up for it needs this supplier set up there
  async addItem(dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<{ id: string }>> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.purchaseOrderId);
    this.assertNotPartOfPurchase(po);
    await this.inventoryItemSitesRepository.canPurchaseAtSite([dto.inventoryItemId], 'inventoryItemId', po.siteId);
    await this.purchasingRulesService.assertSourced(po.supplierId, po.siteId, [dto], 'inventoryItemId');
    const supplierItem = await this.supplierItemsService.findByItemAndUnit(
      po.supplierId,
      dto.inventoryItemId,
      dto.uomId,
    );
    const [primaryUomQty, price, leadTimes, supplier] = await Promise.all([
      this.uomConversionsService.toPrimaryUomQuantity(dto.inventoryItemId, dto.uomId, dto.uomQty),
      supplierItem
        ? this.supplierItemPricesService.resolvePriceForOrderLine(supplierItem.id, po.siteId, po.orderDate)
        : undefined,
      this.supplierItemsService.findSiteLeadTimes(po.supplierId, po.siteId, [dto]),
      this.suppliersService.findByIdOrThrow(po.supplierId),
    ]);
    const leadTimeDays = leadTimes.get(SupplierItemsDomainService.leadTimeKey(dto)) ?? 0;

    const line = await this.database.runInTransaction(async () => {
      const pricedPo = await this.withConversionRate(po, dto.unitPrice.currency, dto.conversionRate);
      const created = await this.itemsService.addItem(pricedPo, dto, {
        inventoryItemId: dto.inventoryItemId,
        uomId: dto.uomId,
        expectedDeliveryDate:
          dto.expectedDeliveryDate ??
          formatISO(addDays(parseISO(po.orderDate), leadTimeDays), { representation: 'date' }),
        primaryUomQty,
        scheme: {
          buyQty: dto.schemeBuyQty ?? price?.schemeBuyQty ?? null,
          freeQty: dto.schemeFreeQty ?? price?.schemeFreeQty ?? null,
          hasScheme: dto.hasScheme ?? (price?.schemeBuyQty != null && price?.schemeFreeQty != null),
        },
        supplierCurrencies: supplier.currencyCodes,
      });
      await this.purchaseOrdersService.syncTotalAmount(po.id);
      return created;
    });

    this.logger.log(`purchaseOrders.addItem — PO: ${po.poNumber}, item: ${dto.inventoryItemId}`);
    return {
      success: true,
      message: `Line item added to purchase order "${po.poNumber}".`,
      data: { id: line.id },
    };
  }

  // Changes a line's item, quantity, price, scheme or expected delivery and syncs the PO total; a line of an item the site
  // has blocked buying may be lowered, repriced or rescheduled, but not raised
  async updateItem(dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(dto.purchaseOrderId);
    this.assertNotPartOfPurchase(po);
    const item = await this.itemsService.findOnPurchaseOrderOrThrow(po.id, dto.itemId);
    const inventoryItemId = dto.inventoryItemId ?? item.inventoryItemId;
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      inventoryItemId,
      item.uomId,
      dto.uomQty ?? item.uomQty,
    );
    if (inventoryItemId !== item.inventoryItemId) {
      await this.inventoryItemSitesRepository.canPurchaseAtSite([inventoryItemId], 'inventoryItemId', po.siteId);
    } else if (new Decimal(primaryUomQty).gt(item.primaryUomQty)) {
      await this.inventoryItemSitesRepository.canPurchaseAtSite([inventoryItemId], 'uomQty', po.siteId);
    }
    const supplier = await this.suppliersService.findByIdOrThrow(po.supplierId);

    return this.database.runInTransaction(async () => {
      const pricedPo = dto.unitPrice
        ? await this.withConversionRate(po, dto.unitPrice.currency, dto.conversionRate)
        : po;
      const result = await this.itemsService.updateItem(pricedPo, dto, {
        primaryUomQty,
        scheme: {
          buyQty: dto.schemeBuyQty ?? item.schemeBuyQty,
          freeQty: dto.schemeFreeQty ?? item.schemeFreeQty,
          hasScheme: dto.hasScheme ?? item.hasScheme,
        },
        supplierCurrencies: supplier.currencyCodes,
      });
      await this.purchaseOrdersService.syncTotalAmount(po.id);
      return result;
    });
  }

  // Returns one page of a PO's lines, each primary-unit counter also in its item's display unit
  async findForTable(
    purchaseOrderId: string,
    state: TableState,
  ): Promise<{ result: PurchaseOrderItemWithDisplayDto[]; count: number }> {
    const { result, count } = await this.itemsService.findForTable(purchaseOrderId, state);
    return {
      result: result.map(({ displayUnitRatios, ...line }) => ({
        ...line,
        display: this.uomConversionsService.toDisplayUomQuantities(
          {
            primaryUomQty: line.primaryUomQty,
            expectedFreePrimaryQty: line.expectedFreePrimaryQty,
            receivedPrimaryQty: line.receivedPrimaryQty,
            rejectedPrimaryQty: line.rejectedPrimaryQty,
            invoicedPrimaryQty: line.invoicedPrimaryQty,
            returnedPrimaryQty: line.returnedPrimaryQty,
            cancelledPrimaryQty: line.cancelledPrimaryQty,
            duePrimaryQty: line.duePrimaryQty,
            openToReceivePrimaryQty: line.openToReceivePrimaryQty,
            openToInvoicePrimaryQty: line.openToInvoicePrimaryQty,
          },
          displayUnitRatios,
        ),
      })),
      count,
    };
  }

  // What a new line of an item starts with on the PO: the supplier's unit for it at the site unless one is given, the
  // price in force there for the supplier's item in that unit with its scheme, and the delivery its lead time gives — each
  // empty where the supplier has nothing set up
  async findItemDefaults(query: PurchaseOrderItemDefaultsQueryDto): Promise<PurchaseOrderItemDefaultsDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(query.id);
    const uomId =
      query.uomId ??
      (await this.supplierItemsService.findSiteUnits(po.supplierId, po.siteId, [query.inventoryItemId])).get(
        query.inventoryItemId,
      ) ??
      null;
    const supplierItem = uomId
      ? await this.supplierItemsService.findByItemAndUnit(po.supplierId, query.inventoryItemId, uomId)
      : undefined;
    const [price, leadTimes] = await Promise.all([
      supplierItem
        ? this.supplierItemPricesService.resolvePriceForOrderLine(supplierItem.id, po.siteId, po.orderDate)
        : undefined,
      uomId
        ? this.supplierItemsService.findSiteLeadTimes(po.supplierId, po.siteId, [
            { inventoryItemId: query.inventoryItemId, uomId },
          ])
        : new Map<string, number>(),
    ]);
    const leadTimeDays = uomId
      ? (leadTimes.get(SupplierItemsDomainService.leadTimeKey({ inventoryItemId: query.inventoryItemId, uomId })) ?? 0)
      : 0;
    return {
      uomId,
      supplierItemCode: supplierItem?.supplierItemCode ?? null,
      minOrderQuantity: supplierItem?.minOrderQuantity ?? null,
      unitPrice: price ? CurrencyAmountDto.from(price.unitPrice, price.currencyCode) : null,
      schemeBuyQty: price?.schemeBuyQty ?? null,
      schemeFreeQty: price?.schemeFreeQty ?? null,
      expectedDeliveryDate: formatISO(addDays(parseISO(po.orderDate), leadTimeDays), { representation: 'date' }),
    };
  }

  // Removes a line and syncs the PO total
  async removeItem(purchaseOrderId: string, itemId: string): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersService.findDetailOrThrow(purchaseOrderId);
    this.assertNotPartOfPurchase(po);
    return this.database.runInTransaction(async () => {
      const result = await this.itemsService.removeItem(po, itemId);
      await this.purchaseOrdersService.syncTotalAmount(po.id);
      return result;
    });
  }

  // Rejects a line change on a PO a purchase created; its lines are the purchase's approved allocations (409)
  private assertNotPartOfPurchase(po: PurchaseOrderRow): void {
    this.purchasesRepository.assertNotPartOfPurchase(`The lines of purchase order "${po.poNumber}"`, [
      po.purchaseNumber,
    ]);
  }

  // Stores a rate sent with a line for its quoted currency, converting the PO's other lines in it, and returns the PO
  private async withConversionRate(
    po: PurchaseOrderRow,
    currencyCode: string,
    rate: number | undefined,
  ): Promise<PurchaseOrderLinesContext> {
    if (rate === undefined || currencyCode === po.currencyCode) return po;
    const stored = await this.purchaseOrdersService.setConversionRate(po, currencyCode, rate);
    const pricedPo = { ...po, conversionRates: { ...po.conversionRates, [currencyCode]: stored } };
    await this.itemsService.repriceSourceCurrency(pricedPo, currencyCode, stored);
    return pricedPo;
  }
}
