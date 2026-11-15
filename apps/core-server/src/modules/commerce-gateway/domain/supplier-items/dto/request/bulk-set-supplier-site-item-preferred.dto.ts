import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class BulkSetSupplierSiteItemPreferredDto {
  @ApiProperty({ type: [String], description: 'Supplier item IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  supplierItemIds: string[];

  @ApiProperty({ type: [String], description: 'Sites to apply the flag at; items not set up at a site are skipped.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  @IsLeSite({ each: true })
  siteIds: string[];

  @ApiProperty({ description: 'Whether to mark the items as the preferred supplier at those sites.' })
  @IsBoolean()
  isPreferred: boolean;
}
