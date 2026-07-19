import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class SuppliersSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  enrollable?: boolean;
}
