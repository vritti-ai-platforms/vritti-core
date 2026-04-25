import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptBatchDto {
  @ApiProperty()
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  acceptedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
