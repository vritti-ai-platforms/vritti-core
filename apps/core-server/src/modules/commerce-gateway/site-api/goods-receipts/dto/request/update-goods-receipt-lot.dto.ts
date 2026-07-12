import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGoodsReceiptLotDto {
  @ApiPropertyOptional({ description: 'Lot number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Manufacturing date', nullable: true })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @ApiPropertyOptional({ description: 'Expiry date (cannot be cleared once set)' })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  expiryDate?: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: 'Printed MRP per primary unit (site currency)',
    nullable: true,
  })
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;
}
