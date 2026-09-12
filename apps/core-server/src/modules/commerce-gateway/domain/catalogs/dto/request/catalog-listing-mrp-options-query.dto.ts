import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CatalogListingMrpOptionsQueryDto {
  @ApiProperty({ description: 'Variant whose MRP slices to list' })
  @IsUUID('all')
  offeringVariantId: string;
}
