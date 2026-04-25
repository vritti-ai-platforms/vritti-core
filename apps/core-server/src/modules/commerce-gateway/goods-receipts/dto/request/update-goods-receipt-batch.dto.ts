import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateGoodsReceiptBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  acceptedQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;
}
