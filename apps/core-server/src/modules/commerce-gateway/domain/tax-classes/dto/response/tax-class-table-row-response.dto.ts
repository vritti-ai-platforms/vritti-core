import { ApiProperty } from '@nestjs/swagger';
import { TaxClassResponseDto } from './tax-class-response.dto';
import { TaxClassTaxGroupResponseDto } from './tax-class-tax-group-response.dto';

export class TaxClassTableRowResponseDto extends TaxClassResponseDto {
  @ApiProperty({
    type: [TaxClassTaxGroupResponseDto],
    description:
      'Tax groups the class is mapped to in the context country on the table’s day, price limits ascending and no limit last; empty when unmapped or with no country',
  })
  taxGroups: TaxClassTaxGroupResponseDto[];
}
