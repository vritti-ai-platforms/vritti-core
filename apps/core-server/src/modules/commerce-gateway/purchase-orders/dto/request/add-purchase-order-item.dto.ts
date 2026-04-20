import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Ordered quantity', example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  orderedQuantity: number;

  @ApiProperty({ description: 'Supplier unit price', example: 99.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  supplierUnitPrice: number;

  @ApiPropertyOptional({ description: 'Unit price', example: 99.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number | null;
}
