import type { UnitRatioDto } from '@domain/uom-conversions/dto/entity/unit-ratio.dto';

export class InventoryItemUnitsDto {
  primaryUomId: string;
  displayUomId: string;
  units: UnitRatioDto[];
}
