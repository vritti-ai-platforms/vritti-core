import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsUUID, Max, Min } from 'class-validator';

export class BulkSetSupplierItemDefaultLeadTimeDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @ApiProperty({
    description:
      'Default whole days from order to delivery, 0 for the same day; applied to every site of the items that does not set its own.',
    minimum: 0,
    maximum: 365,
    example: 0,
  })
  @IsInt()
  @Min(0)
  @Max(365)
  defaultLeadTimeDays: number;
}
