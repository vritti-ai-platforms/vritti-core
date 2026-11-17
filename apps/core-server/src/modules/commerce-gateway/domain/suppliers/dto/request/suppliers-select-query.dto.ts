import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class SuppliersSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Only active suppliers' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Only suppliers with a supplier item for this inventory item' })
  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  @ApiPropertyOptional({
    description:
      "Only suppliers with an active enrollment at this one of the legal entity's sites; required with suppliedItemIds or forPurchaseId",
  })
  @ValidateIf(
    (query: SuppliersSelectQueryDto) =>
      query.enrolledAtSiteId !== undefined || query.suppliedItemIds !== undefined || query.forPurchaseId !== undefined,
  )
  @IsUUID('7')
  @IsLeSite()
  enrolledAtSiteId?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      "Marks the suppliers the legal entity set up any of these inventory items for (comma-separated); onlySupplying or the site's rules keep only them",
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @IsUUID('7', { each: true })
  suppliedItemIds?: string[];

  @ApiPropertyOptional({
    description:
      "With suppliedItemIds, only the suppliers that supply the item at the site (the site's rules may already)",
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlySupplying?: boolean;

  @ApiPropertyOptional({
    description:
      "Marks, and where the site's rules require it keeps, the suppliers set up for this purchase's items still to allocate",
  })
  @IsOptional()
  @IsUUID('7')
  forPurchaseId?: string;
}
