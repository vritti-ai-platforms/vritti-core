import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { InventoryItemLotWithDisplayDto } from '../dto/entity/inventory-item-lot-with-display.dto';

@Injectable()
export class InventoryItemsLotsService {
  private readonly logger = new Logger(InventoryItemsLotsService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly lotsService: InventoryItemLotsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns an item's lots for its table, each with its stock also expressed in the item's display unit
  async findForTable(
    inventoryItemId: string,
    state: TableState,
    leCurrencyCode?: string,
  ): Promise<{ result: InventoryItemLotWithDisplayDto[]; count: number }> {
    this.logger.log(`findForTable — inventoryItemId=${inventoryItemId}`);
    await this.inventoryItemsService.findById(inventoryItemId);
    const { result, count } = await this.lotsService.findLotsForTable(inventoryItemId, state, leCurrencyCode);
    return {
      result: result.map(({ displayUnitRatios, ...lot }) => ({
        ...lot,
        display: this.uomConversionsService.toDisplayUomQuantities(
          {
            stockedQuantity: lot.stockedQuantity,
            reservedQuantity: lot.reservedQuantity,
            availableQuantity: lot.availableQuantity,
          },
          displayUnitRatios,
        ),
      })),
      count,
    };
  }
}
