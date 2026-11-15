import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
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
    description: "Only suppliers with an active enrollment at this one of the legal entity's sites",
  })
  @IsOptional()
  @IsUUID('7')
  @IsLeSite()
  enrolledAtSiteId?: string;
}
