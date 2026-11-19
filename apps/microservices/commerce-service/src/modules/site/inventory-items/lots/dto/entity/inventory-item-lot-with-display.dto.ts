import type { InventoryItemLotDto } from '@domain/inventory-item-lots/dto/entity/inventory-item-lot.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type InventoryItemLotDisplayDto = Record<
  'stockedQuantity' | 'reservedQuantity' | 'availableQuantity',
  DisplayUomQuantityDto | null
>;

export type InventoryItemLotWithDisplayDto = Omit<InventoryItemLotDto, 'displayUnitRatios'> & {
  display: InventoryItemLotDisplayDto;
};
