import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class BulkSetSupplierItemLeadTimeDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @ApiProperty({
    description:
      'Days from order to delivery; applied to every site of the items that does not set its own. Null clears it.',
    nullable: true,
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays: number | null;
}
