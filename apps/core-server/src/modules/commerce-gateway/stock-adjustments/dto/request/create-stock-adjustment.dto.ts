import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockAdjustmentDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory location ID where the adjustment occurs' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ description: 'Adjustment type', example: 'WASTE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Adjustment quantity (positive or negative)', example: -5 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'User ID who performed the adjustment' })
  @IsOptional()
  @IsUUID()
  adjustedBy?: string;
}
