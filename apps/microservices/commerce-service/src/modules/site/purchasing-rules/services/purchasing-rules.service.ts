import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { SitePurchasingSettingsDomainService } from '@domain/site-purchasing-settings/services/site-purchasing-settings.service';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import {
  type SupplierItemLine,
  SupplierItemsDomainService,
} from '@domain/supplier-items/services/supplier-items.service';
import { Injectable, Logger } from '@nestjs/common';
import _ from '@vritti/api-sdk/lodash';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export interface OrderedLine {
  inventoryItemId: string;
  uomId: string;
  expectedDeliveryDate: string;
  unitPrice: bigint;
  currencyCode: string;
  sourceUnitPrice: bigint | null;
  sourceCurrencyCode: string | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
}

export interface SentOrder {
  siteId: string;
  supplierId: string;
  poNumber: string;
  orderDate: string;
}

export interface SupplierPick {
  suppliedItemIds?: string[];
  forPurchaseId?: string;
  onlySupplying?: boolean;
}

export interface SupplierPicker {
  itemIds: string[];
  onlySupplying: boolean;
}

const MAX_LEAD_TIME_DAYS = 365;

@Injectable()
export class PurchasingRulesService {
  private readonly logger = new Logger(PurchasingRulesService.name);

  constructor(
    private readonly settingsService: SitePurchasingSettingsDomainService,
    private readonly inventoryItemSitesRepository: InventoryItemSitesDomainRepository,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly supplierItemPricesService: SupplierItemPricesDomainService,
    private readonly purchaseItemsService: PurchaseItemsDomainService,
  ) {}

  // Records what a sent purchase order bought when the site's Info Update rule is on: each line's supplier item —
  // created with the order's lead time when the supplier has none in that unit — set up at the site, and what it paid
  // as the site's price from the order date. Runs inside the caller's transaction
  async recordSentOrder(order: SentOrder, lines: OrderedLine[]): Promise<void> {
    const settings = await this.settingsService.findForSite(order.siteId);
    if (!settings.updateSupplierItemsFromOrders) return;
    const unique = _.uniqBy(lines, (line) => `${line.inventoryItemId}:${line.uomId}`);
    let priced = 0;
    for (const line of unique) {
      const supplierItemId = await this.supplierItemsService.findOrCreateItemAtSite(
        {
          supplierId: order.supplierId,
          inventoryItemId: line.inventoryItemId,
          uomId: line.uomId,
          supplierItemCode: null,
          defaultLeadTimeDays: PurchasingRulesService.leadTimeOf(order.orderDate, line.expectedDeliveryDate),
        },
        order.siteId,
      );
      const recorded = await this.supplierItemPricesService.recordOrderPrice(supplierItemId, order.siteId, {
        unitPrice: line.sourceUnitPrice ?? line.unitPrice,
        currencyCode: line.sourceCurrencyCode ?? line.currencyCode,
        schemeBuyQty: line.schemeBuyQty,
        schemeFreeQty: line.schemeFreeQty,
        orderDate: order.orderDate,
        poNumber: order.poNumber,
      });
      if (recorded) priced += 1;
    }
    this.logger.log(`Info Update from ${order.poNumber}: ${unique.length} supplier items, ${priced} prices recorded`);
  }

  // Whether the site buys every item only from suppliers that have it set up there
  async requiresSupplierItems(siteId: string): Promise<boolean> {
    return (await this.settingsService.findForSite(siteId)).supplierItemsRequired;
  }

  // Resolves what a supplier picker at the site narrows by: the items it was given, or a purchase's items still to allocate,
  // and whether only suppliers set up for them are listed — when asked, or when the site's rules require supplier items
  // for every one of them
  async findSupplierPicker(siteId: string, pick: SupplierPick): Promise<SupplierPicker> {
    const itemIds =
      pick.suppliedItemIds ??
      (pick.forPurchaseId ? await this.purchaseItemsService.findUnallocatedItemIds(pick.forPurchaseId) : []);
    if (itemIds.length === 0) return { itemIds, onlySupplying: false };
    if (pick.onlySupplying) return { itemIds, onlySupplying: true };
    const required = await this.findRequiredItemIds(siteId, itemIds);
    return { itemIds, onlySupplying: required.size === new Set(itemIds).size };
  }

  // Of the given items, those whose purchase at the site needs the supplier's item set up there: every one while the
  // site's rule is on, else those the legal entity ties to it item by item
  async findRequiredItemIds(siteId: string, inventoryItemIds: string[]): Promise<Set<string>> {
    const uniqueIds = _.uniq(inventoryItemIds);
    if (uniqueIds.length === 0) return new Set();
    const settings = await this.settingsService.findForSite(siteId);
    if (settings.supplierItemsRequired) return new Set(uniqueIds);
    return new Set(await this.inventoryItemSitesRepository.findSupplierItemsRequiredIds(uniqueIds, siteId));
  }

  // Of the given items, those the site's rules keep the supplier from being bought for: required to be set up and not set
  // up as one of its items by the legal entity
  async findUnsourcedItemIds(supplierId: string, siteId: string, inventoryItemIds: string[]): Promise<Set<string>> {
    const required = [...(await this.findRequiredItemIds(siteId, inventoryItemIds))];
    if (required.length === 0) return new Set();
    const setUp = await this.supplierItemsService.findSetUpItemIds(supplierId, required);
    return new Set(required.filter((id) => !setUp.has(id)));
  }

  // Rejects buying lines from the supplier at the site when the site's rules require supplier items and the legal entity
  // has not set the line's item up as one of the supplier's items, in the line's unit when it has one
  async assertSourced(supplierId: string, siteId: string, lines: SupplierItemLine[], field: string): Promise<void> {
    const required = await this.findRequiredItemIds(
      siteId,
      lines.map((line) => line.inventoryItemId),
    );
    await this.supplierItemsService.assertSetUp(
      supplierId,
      lines.filter((line) => required.has(line.inventoryItemId)),
      field,
    );
  }

  // Days from the order to the expected delivery, within what a supplier item holds
  private static leadTimeOf(orderDate: string, expectedDeliveryDate: string): number {
    return _.clamp(
      differenceInCalendarDays(parseISO(expectedDeliveryDate), parseISO(orderDate)),
      0,
      MAX_LEAD_TIME_DAYS,
    );
  }
}
