import { ApiPropertyOptional } from '@nestjs/swagger';
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
}
