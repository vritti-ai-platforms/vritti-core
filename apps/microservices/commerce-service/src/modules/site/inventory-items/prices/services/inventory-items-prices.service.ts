import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import type { ItemSupplierPriceDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price.dto';
import type { InventoryItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';

@Injectable()
export class InventoryItemsPricesService {
  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly supplierItemPricesService: SupplierItemPricesDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly mrpsService: InventoryItemMrpsDomainService,
  ) {}

  // The item's MRPs that supplier prices at the site were agreed against within a window, as select options
  findMrps(
    inventoryItemId: string,
    siteId: string,
    range: { from?: string; to?: string },
    query: SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    return this.mrpsService.findForSelect({ ...query, inventoryItemId, pricedAt: { siteId, ...range } });
  }

  // The suppliers with a price for the item at the site within a window, as select options
  findSuppliers(
    inventoryItemId: string,
    siteId: string,
    range: { from?: string; to?: string },
    query: SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    return this.suppliersService.findForSelect(query, { pricedItem: { inventoryItemId, siteId, ...range } });
  }

  // Every supplier's price rows for the item at the site, paginated
  findForTable(
    inventoryItemId: string,
    siteId: string,
    state: TableViewState,
  ): Promise<{ result: ItemSupplierPriceDto[]; count: number }> {
    return this.supplierItemPricesService.findItemPricesAtSiteForTable(inventoryItemId, siteId, state);
  }

  // Every supplier's prices for the item at the site, per the item's primary unit
  async findHistory(
    inventoryItemId: string,
    siteId: string,
    range: { from?: string; to?: string; supplierIds?: string[]; mrpIds?: string[] },
  ): Promise<InventoryItemPriceHistoryDto> {
    const item = await this.inventoryItemsService.findById(inventoryItemId);
    const { suppliers, supplierCount } = await this.supplierItemPricesService.findItemPriceHistoryAtSite(
      inventoryItemId,
      siteId,
      range,
      (uomId) => this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, uomId, 1),
    );
    return { siteId, uomSymbol: item.uomSymbol ?? null, suppliers, supplierCount };
  }
}
