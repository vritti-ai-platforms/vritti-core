import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import _ from '@vritti/api-sdk/lodash';
import type { CurrencyCode } from '@vritti/api-sdk/money';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import type { DisplayUnitRatios } from '@/db/schema';
import {
  SITE_STOCK_QUANTITY_KEYS,
  type SiteStockQuantityKey,
} from '@/modules/site/inventory-items/root/dto/entity/site-stock-display.dto';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';
import type { InventoryItemsSelectQueryDto } from '../dto/request/inventory-items-select-query.dto';
import type { SuppliersSelectQueryDto } from '../dto/request/suppliers-select-query.dto';

@Injectable()
export class PurchasingPickersService {
  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly purchasingRulesService: PurchasingRulesService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns inventory item options, leaving out those already on a purchase when one is named; with a site, only the items
  // it carries with their stock there, and with a supplier too, those set up as its items marked and the others left out
  // where the site's rules require supplier items
  async findInventoryItems(
    query: InventoryItemsSelectQueryDto,
    leCurrencyCode: CurrencyCode,
  ): Promise<SelectQueryResult> {
    const {
      excludeOnSupplierId,
      atSiteId,
      notAtSiteId,
      notOnPurchaseId,
      stockStatus,
      categoryIds,
      supplierId,
      ...page
    } = query;
    const result = await this.inventoryItemsService.findForSelect(page, {
      excludeOnSupplierId,
      notAtSiteId,
      notOnPurchaseId,
      categoryIds,
      atSite: atSiteId ? { siteId: atSiteId, stockStatus, leCurrencyCode } : undefined,
      supplier:
        atSiteId && supplierId
          ? { supplierId, siteRequires: await this.purchasingRulesService.requiresSupplierItems(atSiteId) }
          : undefined,
    });
    if (!atSiteId) return result;

    // At a site each option's stock and levels also go out in the item's display unit, in place of the ratios
    return {
      ...result,
      options: result.options.map((option) => {
        const { displayUnitRatios, ...additionals } = option.additionals ?? {};
        return {
          ...option,
          additionals: {
            ...additionals,
            display: this.uomConversionsService.toDisplayUomQuantities(
              _.pick(additionals, SITE_STOCK_QUANTITY_KEYS) as Record<SiteStockQuantityKey, number | null>,
              displayUnitRatios as DisplayUnitRatios,
            ),
          },
        };
      }),
    };
  }

  // Returns supplier options, only those enrolled at a site with enrolledAtSiteId; there, those set up for the picker's
  // items are marked and only they are kept where asked or where the site's rules require it
  async findSuppliers(query: SuppliersSelectQueryDto): Promise<SelectQueryResult> {
    const { activeOnly, inventoryItemId, enrolledAtSiteId, suppliedItemIds, forPurchaseId, onlySupplying, ...page } =
      query;
    const picker = enrolledAtSiteId
      ? await this.purchasingRulesService.findSupplierPicker(enrolledAtSiteId, {
          suppliedItemIds,
          forPurchaseId,
          onlySupplying,
        })
      : undefined;
    return this.suppliersService.findForSelect(page, {
      activeOnly,
      inventoryItemId,
      enrolledAtSiteId,
      suppliedItemIds: picker?.itemIds,
      onlySupplying: picker?.onlySupplying,
    });
  }
}
