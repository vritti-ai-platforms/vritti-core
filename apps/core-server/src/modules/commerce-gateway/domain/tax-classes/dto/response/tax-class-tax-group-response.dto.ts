import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class TaxClassTaxGroupResponseDto {
  @ApiProperty({ description: 'Tax group the class is mapped to' })
  taxGroupId: string;

  @ApiProperty({ description: 'Tax group code', example: 'gst-5' })
  taxGroupCode: string;

  @ApiProperty({ description: 'Tax group name', example: 'GST 5%' })
  taxGroupName: string;

  @ApiProperty({
    description: 'Highest unit price the mapping applies to; null when it applies at any price',
    type: () => CurrencyAmountDto,
    nullable: true,
  })
  maxUnitPrice: CurrencyAmountDto | null;
}
