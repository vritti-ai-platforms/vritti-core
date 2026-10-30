import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import type { PurchaseOrderItemDto } from '@domain/purchase-order-items/dto/entity/purchase-order-item.dto';
import type { AddPurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/add-purchase-order-item.dto';
import type { UpdatePurchaseOrderItemDto } from '@domain/purchase-order-items/dto/request/update-purchase-order-item.dto';
import { PurchaseOrderItemsDomainRepository } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import {
  type PurchaseOrderContext,
  PurchaseOrderItemsDomainService,
} from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderDto } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrderDto as PurchaseOrderDtoClass } from '@domain/purchase-orders/dto/entity/purchase-order.dto';
import { PurchaseOrdersDomainRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierItemPricesDomainRepository } from '@domain/supplier-item-prices/repositories/supplier-item-prices.repository';
import { SupplierItemsDomainRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class PurchaseOrdersItemsService {
  private readonly logger = new Logger(PurchaseOrdersItemsService.name);

  constructor(
    private readonly itemsService: PurchaseOrderItemsDomainService,
    private readonly itemsRepository: PurchaseOrderItemsDomainRepository,
    private readonly repository: PurchaseOrdersDomainRepository,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly supplierItemsRepository: SupplierItemsDomainRepository,
    private readonly supplierItemPricesRepository: SupplierItemPricesDomainRepository,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly database: PrimaryDatabaseService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly inventoryItemSitesService: InventoryItemSitesDomainService,
  ) {}

  async findItems(poId: string): Promise<PurchaseOrderItemDto[]> {
    await this.getPurchaseOrderContext(poId);
    return this.itemsService.findByPoId(poId);
  }

  async findItemIds(poId: string): Promise<string[]> {
    const po = await this.repository.findByIdWithSupplierName(poId);
    if (!po) throw new NotFoundException('Purchase order not found.');
    return this.itemsService.findIdsByPoId(poId);
  }

  async findItemsForTable(
    poId: string,
    state: TableViewState,
  ): Promise<{ result: PurchaseOrderItemDto[]; count: number }> {
    await this.getPurchaseOrderContext(poId);
    return this.itemsService.findForTable(poId, state);
  }

  async addItem(poId: string, data: AddPurchaseOrderItemDto): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const po = await this.getPurchaseOrderContext(poId);
    await this.assertNoGoodsReceipt(poId);

    const supplierItem = await this.supplierItemsRepository.findById(data.supplierItemId);
    if (!supplierItem) {
      throw new ValidationException({
        detail: 'Supplier item not found.',
        errors: [{ field: 'supplierItemId', message: 'Supplier item not found.' }],
      });
    }

    if (supplierItem.supplierId !== po.supplierId) {
      throw new ValidationException({
        detail: 'This supplier item does not belong to the purchase order supplier.',
        errors: [{ field: 'supplierItemId', message: 'Supplier mismatch.' }],
      });
    }

    const itemSite = await this.supplierItemsRepository.findItemSite(supplierItem.id, po.siteId);
    if (!itemSite) {
      throw new BadRequestException({
        label: 'Item Not At Site',
        detail: 'This supplier item is not set up at this site.',
        errors: [{ field: 'supplierItemId', message: 'Not set up at this site' }],
      });
    }

    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      supplierItem.inventoryItemId,
      supplierItem.uomId,
      data.uomQty,
    );

    // Scheme override from the form, falling back to the site's price in force on the order date.
    const price = await this.supplierItemPricesRepository.resolvePrice(supplierItem.id, po.siteId, po.orderDate);
    const scheme = {
      buyQty: data.schemeBuyQty ?? price?.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? price?.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? (price?.schemeBuyQty != null && price?.schemeFreeQty != null),
    };

    const supplierCurrencies = await this.supplierCurrencies(po.supplierId);
    await this.database.runInTransaction(async () => {
      const priced = await this.withConversionRate(po, data.unitPrice.currency, data.conversionRate);
      await this.itemsService.addItem(
        priced,
        data,
        supplierItem.inventoryItemId,
        supplierItem.uomId,
        primaryUomQty,
        scheme,
        supplierCurrencies,
      );
      await this.inventoryItemSitesService.ensureEnabled(po.siteId, [supplierItem.inventoryItemId]);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Added PO item: ${po.poNumber} (${poId})`);
    return {
      success: true,
      message: `Line item added to purchase order "${po.poNumber}".`,
      data: PurchaseOrderDtoClass.from(po, po.supplierName),
    };
  }

  async updateItem(poId: string, itemId: string, data: UpdatePurchaseOrderItemDto): Promise<SuccessResponseDto> {
    const po = await this.getPurchaseOrderContext(poId);
    await this.assertNoGoodsReceipt(poId);

    const existingItem = await this.itemsRepository.findItemById(poId, itemId);
    if (!existingItem) throw new NotFoundException('Purchase order line item not found.');

    const inventoryItemId = data.inventoryItemId ?? existingItem.inventoryItemId;
    const uomId = existingItem.uomId;
    const orderedUomQty = data.uomQty ?? existingItem.uomQty;

    // Recompute the primary-UOM quantity for the current item, uom, and qty
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, uomId, orderedUomQty);

    // Scheme override from the form, falling back to the line's existing scheme.
    const scheme = {
      buyQty: data.schemeBuyQty ?? existingItem.schemeBuyQty ?? null,
      freeQty: data.schemeFreeQty ?? existingItem.schemeFreeQty ?? null,
      hasScheme: data.hasScheme ?? existingItem.hasScheme ?? false,
    };

    const supplierCurrencies = await this.supplierCurrencies(po.supplierId);
    await this.database.runInTransaction(async () => {
      const priced = data.unitPrice
        ? await this.withConversionRate(po, data.unitPrice.currency, data.conversionRate)
        : po;
      await this.itemsService.updateItem(priced, itemId, data, primaryUomQty, scheme, supplierCurrencies);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Updated PO item: ${po.poNumber} (${itemId})`);
    return { success: true, message: `Line item updated for purchase order "${po.poNumber}".` };
  }

  async removeItem(poId: string, itemId: string): Promise<SuccessResponseDto> {
    const po = await this.getPurchaseOrderContext(poId);
    await this.assertNoGoodsReceipt(poId);

    await this.database.runInTransaction(async () => {
      await this.itemsService.removeItem(po, itemId);
      await this.repository.syncTotalAmount(poId);
    });

    this.logger.log(`Removed PO item: ${po.poNumber} (${itemId})`);
    return { success: true, message: `Line item removed from purchase order "${po.poNumber}".` };
  }

  // Every currency the PO's supplier trades in — what a line's price may be quoted in
  private async supplierCurrencies(supplierId: string): Promise<string[]> {
    const supplier = await this.supplierItemsRepository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return supplier.currencyCodes;
  }

  // Applies a rate sent with a line for the currency it is quoted in — stored on the PO and re-converting the PO's
  // other lines in that currency — and returns the PO as the line should be priced against
  private async withConversionRate(
    po: PurchaseOrderContext,
    currencyCode: string,
    rate: number | undefined,
  ): Promise<PurchaseOrderContext> {
    if (rate == null || currencyCode === po.currencyCode) return po;
    const stored = await this.purchaseOrdersService.setConversionRate(po.id, currencyCode, rate);
    const updated = { ...po, conversionRates: { ...po.conversionRates, [currencyCode]: stored } };
    await this.itemsService.repriceSourceCurrency(updated, currencyCode, stored);
    return updated;
  }

  private async getPurchaseOrderContext(poId: string) {
    const po = await this.repository.findByIdWithSupplierName(poId);
    if (!po) throw new NotFoundException('Purchase order not found.');
    return po;
  }

  private async assertNoGoodsReceipt(poId: string): Promise<void> {
    if (await this.goodsReceiptsService.hasGoodsReceiptForPo(poId)) {
      throw new BadRequestException({
        label: 'Cannot Edit Line Items',
        detail: 'A goods receipt exists for this purchase order, so its line items can no longer be edited.',
      });
    }
  }
}
