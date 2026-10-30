import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemMinOrderDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @ApiProperty({
    description: "The least the supplier sells per order, in each item's own unit; null clears it.",
    nullable: true,
    example: 10,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minOrderQuantity: number | null;
}
