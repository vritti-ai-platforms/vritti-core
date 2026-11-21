import type { TaxClassCounts } from '../../repositories/tax-classes.repository';

export class TaxClassCountsDto {
  groupCount: number;

  // Shapes how many group mappings a tax class has, one per tab
  static from(row: TaxClassCounts): TaxClassCountsDto {
    const dto = new TaxClassCountsDto();
    dto.groupCount = row.groupCount;
    return dto;
  }
}
