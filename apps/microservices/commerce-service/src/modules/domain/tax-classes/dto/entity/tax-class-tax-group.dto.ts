import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { TaxClassTaxGroupRow } from '../../repositories/tax-classes.repository';

export class TaxClassTaxGroupDto {
  taxGroupId: string;
  taxGroupCode: string;
  taxGroupName: string;
  maxUnitPrice: CurrencyAmountDto | null;

  // Maps a tax group a class is mapped to on a day; the price limit is optional
  static from(row: TaxClassTaxGroupRow): TaxClassTaxGroupDto {
    const dto = new TaxClassTaxGroupDto();
    dto.taxGroupId = row.taxGroupId;
    dto.taxGroupCode = row.taxGroupCode;
    dto.taxGroupName = row.taxGroupName;
    dto.maxUnitPrice =
      row.maxUnitPrice === null || row.currencyCode === null
        ? null
        : CurrencyAmountDto.from(BigInt(row.maxUnitPrice), row.currencyCode);
    return dto;
  }
}
