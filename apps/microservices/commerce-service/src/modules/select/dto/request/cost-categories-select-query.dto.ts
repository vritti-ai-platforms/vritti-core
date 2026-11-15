import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class CostCategoriesSelectQueryDto extends SelectOptionsQueryDto {
  // Only the active categories an invoice charge line can take (not ITEM)
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  chargeOnly?: boolean;
}
