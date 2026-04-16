import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockAdjustmentDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'Adjustment type', example: 'WASTE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Adjustment quantity', example: 100 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
