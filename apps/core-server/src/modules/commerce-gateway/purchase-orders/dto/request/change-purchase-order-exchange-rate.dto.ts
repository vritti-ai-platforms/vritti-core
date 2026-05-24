import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class ChangePurchaseOrderExchangeRateDto {
  @ApiProperty({
    description: 'Exchange rate policy. FIXED locks the rate; VARIABLE clears it (resolved at GR/invoice).',
    enum: ['FIXED', 'VARIABLE'],
  })
  @IsIn(['FIXED', 'VARIABLE'])
  exchangeRateType: 'FIXED' | 'VARIABLE';

  @ApiPropertyOptional({
    description: 'Exchange rate from supplier currency to BU currency. Required when FIXED.',
    example: 83.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
