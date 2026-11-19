import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable } from '@nestjs/common';
import type { InventoryItemUnitsDto } from '../dto/entity/inventory-item-units.dto';

@Injectable()
export class InventoryItemUnitsService {
  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Returns the units a quantity of the item can be entered in, each with its exact ratio to the primary unit, and the
  // primary and display units
  async findUnits(inventoryItemId: string): Promise<InventoryItemUnitsDto> {
    const { uomId, displayUomId, allowedUomIds } = await this.inventoryItemsService.findAllowedUomIds(inventoryItemId);
    return {
      primaryUomId: uomId,
      displayUomId,
      units: await this.uomConversionsService.findUnitRatios(inventoryItemId, uomId, allowedUomIds),
    };
  }
}
