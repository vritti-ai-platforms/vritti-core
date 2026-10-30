import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetSupplierItemPreferredDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @ApiProperty({ type: [String], description: 'Sites to apply the flag at; items not set up at a site are skipped.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  siteIds: string[];

  @ApiProperty({ description: 'Whether to mark the items as the preferred supplier at those sites.' })
  @IsBoolean()
  isPreferred: boolean;
}
