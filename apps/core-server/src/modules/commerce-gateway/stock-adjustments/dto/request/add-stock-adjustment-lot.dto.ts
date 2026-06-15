import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddStockAdjustmentLotDto {
  @ApiProperty({ description: 'Lot number (must not already exist on inventory_item_lots)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lotNumber: string;

  @ApiPropertyOptional({ description: 'Manufacturing date' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @ApiProperty({ description: 'Expiry date (required)' })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Printed MRP per primary unit (BU currency)', nullable: true })
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto | null;
}
