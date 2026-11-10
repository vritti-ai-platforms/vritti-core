import type { ItemSupplierPriceComparisonDto } from '@domain/supplier-item-prices/dto/entity/item-supplier-price-comparison.dto';
import type { InventoryItemPriceHistoryDto } from '@domain/supplier-item-prices/dto/entity/supplier-item-price-history.dto';
import { SupplierItemPricesDomainService } from '@domain/supplier-item-prices/services/supplier-item-prices.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import { conditionValue, type FilterCondition } from '@vritti/api-sdk/conditions';
import type { TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';

@Injectable()
export class LeInventoryItemPricesService {
  constructor(
    private readonly supplierItemPricesService: SupplierItemPricesDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Every supplier's standing for the item at the table's context site on its context day — the price in force, per
  // primary unit and after its scheme
  findTable(
    inventoryItemId: string,
    state: TableState,
  ): Promise<{ result: ItemSupplierPriceComparisonDto[]; count: number }> {
    return this.supplierItemPricesService.findItemPriceComparisonTable(inventoryItemId, state);
  }

  // The item's price history at one site, per the context's unit (the item's own when none is picked)
  async findHistory(
    inventoryItemId: string,
    siteId: string,
    context: FilterCondition[],
  ): Promise<InventoryItemPriceHistoryDto> {
    const primaryPerUnit = await this.primaryPerPickedUnit(inventoryItemId, conditionValue(context, 'uom'));
    return this.supplierItemPricesService.findItemPriceHistoryAtSite(
      inventoryItemId,
      siteId,
      context,
      async (supplierUomId) =>
        new Decimal(await this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, supplierUomId, 1)).dividedBy(
          primaryPerUnit,
        ),
    );
  }

  // How many of the item's primary units one of the picked unit holds; 1 (the item's own unit) when none is picked
  private async primaryPerPickedUnit(inventoryItemId: string, uomId: string | undefined): Promise<Decimal> {
    if (!uomId) return new Decimal(1);
    return new Decimal(await this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, uomId, 1));
  }
}
