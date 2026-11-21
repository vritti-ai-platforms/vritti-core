import { ApiProperty } from '@nestjs/swagger';

export class SupplierQuotationCountsResponseDto {
  @ApiProperty({ description: "The quotation's lines", example: 6 })
  itemCount: number;

  @ApiProperty({
    description: 'Sites the quotation is posted to, the whole legal entity counting as one',
    example: 2,
  })
  siteCount: number;
}
