import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class SuppliersSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsUUID('7')
  inventoryItemId?: string;

  // Only the suppliers with an active enrollment at this site; the gateway has checked it is one of the legal entity's
  @IsOptional()
  @IsUUID('7')
  enrolledAtSiteId?: string;
}
