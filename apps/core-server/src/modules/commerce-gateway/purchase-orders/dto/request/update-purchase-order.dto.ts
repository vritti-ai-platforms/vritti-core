import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class UpdatePurchaseOrderItemDto {
  @ApiPropertyOptional({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Ordered quantity', example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  orderedQuantity: number;

  @ApiPropertyOptional({ description: 'Unit price', example: 99.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number | null;
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({
    description: 'PO status',
    enum: ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Order date (ISO string)' })
  @IsOptional()
  @IsString()
  orderDate?: string;

  @ApiPropertyOptional({ description: 'Expected-by date/time (ISO string with timezone)' })
  @IsOptional()
  @IsString()
  expectedBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Total amount (null to clear)', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number | null;

  @ApiPropertyOptional({ description: 'Replace all line items', type: [UpdatePurchaseOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  items?: UpdatePurchaseOrderItemDto[];
}
