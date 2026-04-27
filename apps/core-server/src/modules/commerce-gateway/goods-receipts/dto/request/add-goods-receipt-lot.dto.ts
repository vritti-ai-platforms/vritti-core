import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddGoodsReceiptLotDto {
  @ApiProperty({ description: 'Lot number (must not already exist on inventory_item_lots)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lotNumber: string;

  @ApiPropertyOptional({ description: 'Manufacturing date' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;
}
