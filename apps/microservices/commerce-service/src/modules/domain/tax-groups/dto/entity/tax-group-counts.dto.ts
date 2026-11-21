import type { TaxGroupCounts } from '../../repositories/tax-groups.repository';

export class TaxGroupCountsDto {
  rateCount: number;
  classCount: number;

  // Shapes how many rates and class mappings a tax group has, one per tab
  static from(row: TaxGroupCounts): TaxGroupCountsDto {
    const dto = new TaxGroupCountsDto();
    dto.rateCount = row.rateCount;
    dto.classCount = row.classCount;
    return dto;
  }
}
