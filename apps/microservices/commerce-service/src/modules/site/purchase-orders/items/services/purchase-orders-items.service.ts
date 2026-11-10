import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import type { AddPurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/update-purchase-order-item.dto';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import {
  PurchaseOrderItemsDomainService,
  type PurchaseOrderLinesContext,
} from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import {
  type PurchaseOrderRow,
  PurchaseOrdersDomainRepository,
} from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierItemPricesDomainRepository } from '@domain/supplier-item-prices/repositories/supplier-item-prices.repository';
import { SupplierItemsDomainRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { SuppliersDomainRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, ValidationException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { addDays, formatISO, parseISO } from 'date-fns';

@Injectable()
export class PurchaseOrdersItemsService {
  private readonly logger = new Logger(PurchaseOrdersItemsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrdersRepository: PurchaseOrdersDomainRepository,
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly itemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly suppliersRepository: SuppliersDomainRepository,
    private readonly supplierItemsRepository: SupplierItemsDomainRepository,
    private readonly supplierItemPricesRepository: SupplierItemPricesDomainRepository,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly inventoryItemSitesService: InventoryItemSitesDomainService,
  ) {}

  // Orders a supplier item set up at the PO's site, defaulting its scheme and delivery from the site's price and lead time
  async addItem(dto: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(dto.purchaseOrderId);
    const supplierItem = await this.supplierItemsRepository.findById(dto.supplierItemId);
    if (!supplierItem || supplierItem.supplierId !== po.supplierId) {
      throw new ValidationException({
        label: 'Unknown Supplier Item',
        detail: "The item is not one of the purchase order supplier's items.",
        errors: [{ field: 'supplierItemId', message: "Not this supplier's item" }],
      });
    }
    const supplierSiteItem = await this.supplierItemsRepository.findSiteItem(supplierItem.id, po.siteId);
    if (!supplierSiteItem) {
      throw new BadRequestException({
        label: 'Item Not At Site',
        detail: "This supplier item is not set up at the purchase order's site.",
        errors: [{ field: 'supplierItemId', message: 'Not set up at this site' }],
      });
    }

    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      supplierItem.inventoryItemId,
      supplierItem.uomId,
      dto.uomQty,
    );
    const price = await this.supplierItemPricesRepository.resolvePrice(supplierItem.id, po.siteId, po.orderDate);
    const supplier = await this.suppliersRepository.findByIdOrThrow(po.supplierId);

    await this.database.runInTransaction(async () => {
      const pricedPo = await this.withConversionRate(po, dto.unitPrice.currency, dto.conversionRate);
      await this.itemsService.addItem(pricedPo, dto, {
        inventoryItemId: supplierItem.inventoryItemId,
        uomId: supplierItem.uomId,
        expectedDeliveryDate:
          dto.expectedDeliveryDate ??
          formatISO(addDays(parseISO(po.orderDate), supplierSiteItem.leadTimeDays), { representation: 'date' }),
        primaryUomQty,
        scheme: {
          buyQty: dto.schemeBuyQty ?? price?.schemeBuyQty ?? null,
          freeQty: dto.schemeFreeQty ?? price?.schemeFreeQty ?? null,
          hasScheme: dto.hasScheme ?? (price?.schemeBuyQty != null && price?.schemeFreeQty != null),
        },
        supplierCurrencies: supplier.currencyCodes,
      });
      await this.inventoryItemSitesService.ensureEnabled(po.siteId, [supplierItem.inventoryItemId]);
      await this.purchaseOrdersRepository.syncTotalAmount(po.id);
    });

    this.logger.log(`purchaseOrders.addItem — PO: ${po.poNumber}, supplierItem: ${supplierItem.id}`);
    return {
      success: true,
      message: `Line item added to purchase order "${po.poNumber}".`,
      data: await this.purchaseOrdersService.findById(po.id),
    };
  }

  // Changes a line's item, quantity, price, scheme or expected delivery and syncs the PO total
  async updateItem(dto: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(dto.purchaseOrderId);
    const item = await this.itemsRepository.findOnPurchaseOrderOrThrow(po.id, dto.itemId);
    const inventoryItemId = dto.inventoryItemId ?? item.inventoryItemId;
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      inventoryItemId,
      item.uomId,
      dto.uomQty ?? item.uomQty,
    );
    const supplier = await this.suppliersRepository.findByIdOrThrow(po.supplierId);

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
      await this.purchaseOrdersRepository.syncTotalAmount(po.id);
      return result;
    });
  }

  // Removes a line and syncs the PO total
  async removeItem(purchaseOrderId: string, itemId: string): Promise<SuccessResponseDto> {
    const po = await this.purchaseOrdersRepository.findDetailOrThrow(purchaseOrderId);
    return this.database.runInTransaction(async () => {
      const result = await this.itemsService.removeItem(po, itemId);
      await this.purchaseOrdersRepository.syncTotalAmount(po.id);
      return result;
    });
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
