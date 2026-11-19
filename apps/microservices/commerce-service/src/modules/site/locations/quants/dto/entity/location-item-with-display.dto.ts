import type { LocationItemDto } from '@domain/inventory-item-quants/dto/entity/location-item.dto';
import type { LocationItemQuantDto } from '@domain/inventory-item-quants/dto/entity/location-item-quant.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type LocationItemDisplayDto = Record<'totalQuantity' | 'availableQuantity', DisplayUomQuantityDto | null>;

export type LocationItemWithDisplayDto = Omit<LocationItemDto, 'displayUnitRatios'> & {
  display: LocationItemDisplayDto;
};

export type LocationItemQuantDisplayDto = Record<'quantity' | 'availableQuantity', DisplayUomQuantityDto | null>;

export type LocationItemQuantWithDisplayDto = Omit<LocationItemQuantDto, 'displayUnitRatios'> & {
  display: LocationItemQuantDisplayDto;
};
