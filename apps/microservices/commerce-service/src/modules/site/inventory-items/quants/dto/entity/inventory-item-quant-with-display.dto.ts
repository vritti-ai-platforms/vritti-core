import type { InventoryItemQuantDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type InventoryItemQuantDisplayDto = Record<
  'quantity' | 'reservedQuantity' | 'availableQuantity',
  DisplayUomQuantityDto | null
>;

export type InventoryItemQuantWithDisplayDto = Omit<InventoryItemQuantDto, 'displayUnitRatios'> & {
  display: InventoryItemQuantDisplayDto;
};
