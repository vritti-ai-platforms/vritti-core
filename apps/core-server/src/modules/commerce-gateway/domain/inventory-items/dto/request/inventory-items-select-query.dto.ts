import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class InventoryItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Exclude items already linked to this supplier' })
  @IsOptional()
  @IsUUID('7')
  excludeOnSupplierId?: string;

  @ApiPropertyOptional({
    description:
      "Only the items with stock levels set at this site — the user's site, or one of the legal entity's sites",
  })
  @IsOptional()
  @IsUUID('7')
  stockLevelsAtSiteId?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'With stockLevelsAtSiteId, only the items whose stock there has one of these statuses (comma-separated)',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsString({ each: true })
  stockStatus?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Only the items filed under one of these categories (comma-separated)',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  categoryIds?: string[];
}
