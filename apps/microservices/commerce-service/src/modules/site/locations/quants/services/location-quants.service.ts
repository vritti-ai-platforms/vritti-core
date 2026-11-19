import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { TableState } from '@vritti/api-sdk/data-table';
import type {
  LocationItemQuantWithDisplayDto,
  LocationItemWithDisplayDto,
} from '../dto/entity/location-item-with-display.dto';

// Top-level service for what a location holds, with every stocked quantity also expressed in the item's display unit.
@Injectable()
export class LocationQuantsService {
  constructor(
    private readonly quantsService: InventoryItemQuantsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns a location's stocked items for its table
  async findItemsTable(
    locationId: string,
    state: TableState,
  ): Promise<{ result: LocationItemWithDisplayDto[]; count: number }> {
    const { result, count } = await this.quantsService.findItemsForLocationTable(locationId, state);
    return {
      result: result.map(({ displayUnitRatios, ...item }) => ({
        ...item,
        display: this.uomConversionsService.toDisplayUomQuantities(
          { totalQuantity: item.totalQuantity, availableQuantity: item.availableQuantity },
          displayUnitRatios,
        ),
      })),
      count,
    };
  }

  // Returns the quants one item holds in a location
  async findItemQuants(locationId: string, itemId: string): Promise<LocationItemQuantWithDisplayDto[]> {
    const quants = await this.quantsService.findItemBreakdownForLocation(locationId, itemId);
    return quants.map(({ displayUnitRatios, ...quant }) => ({
      ...quant,
      display: this.uomConversionsService.toDisplayUomQuantities(
        { quantity: quant.quantity, availableQuantity: quant.availableQuantity },
        displayUnitRatios,
      ),
    }));
  }
}
