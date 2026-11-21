import type { OfferingVariantCounts } from '../../repositories/offering-variants.repository';

export class OfferingVariantCountsDto {
  bomLineCount: number;

  // Shapes how many bill-of-materials lines a variant has, one per tab
  static from(row: OfferingVariantCounts): OfferingVariantCountsDto {
    const dto = new OfferingVariantCountsDto();
    dto.bomLineCount = row.bomLineCount;
    return dto;
  }
}
