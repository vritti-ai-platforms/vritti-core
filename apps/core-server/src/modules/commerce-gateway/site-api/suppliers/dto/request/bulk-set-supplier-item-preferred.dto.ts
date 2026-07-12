import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetSupplierItemPreferredDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  supplierItemIds: string[];

  @ApiProperty({ description: 'Whether to mark the items as the preferred supplier for their inventory items.' })
  @IsBoolean()
  isPreferred: boolean;
}
