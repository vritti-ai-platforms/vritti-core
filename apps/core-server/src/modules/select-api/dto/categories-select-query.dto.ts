import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsIn, IsOptional } from 'class-validator';

export class CategoriesSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsIn(['GROUP', 'CATEGORY'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
