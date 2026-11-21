import type { OfferingCounts } from '../../repositories/offerings.repository';

export class OfferingCountsDto {
  dimensionCount: number;
  attributeCount: number;
  variantCount: number;

  // Shapes how many dimensions, attributes and variants an offering has, one per tab
  static from(row: OfferingCounts): OfferingCountsDto {
    const dto = new OfferingCountsDto();
    dto.dimensionCount = row.dimensionCount;
    dto.attributeCount = row.attributeCount;
    dto.variantCount = row.variantCount;
    return dto;
  }
}
