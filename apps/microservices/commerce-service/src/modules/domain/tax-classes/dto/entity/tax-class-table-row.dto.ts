import type { TaxClassTableRow } from '../../repositories/tax-classes.repository';
import { TaxClassDto } from './tax-class.dto';
import { TaxClassTaxGroupDto } from './tax-class-tax-group.dto';

export class TaxClassTableRowDto extends TaxClassDto {
  taxGroups: TaxClassTaxGroupDto[];

  // Maps a tax class with the tax groups it is mapped to on the table's day
  static from(row: TaxClassTableRow, canDelete = true): TaxClassTableRowDto {
    const dto = Object.assign(new TaxClassTableRowDto(), TaxClassDto.from(row, canDelete));
    dto.taxGroups = row.taxGroups.map(TaxClassTaxGroupDto.from);
    return dto;
  }
}
