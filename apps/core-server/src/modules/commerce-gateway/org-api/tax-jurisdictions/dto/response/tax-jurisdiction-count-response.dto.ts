import { ApiProperty } from '@nestjs/swagger';

export class TaxJurisdictionCountResponseDto {
  @ApiProperty({ description: 'Total number of tax jurisdictions' })
  count: number;
}
