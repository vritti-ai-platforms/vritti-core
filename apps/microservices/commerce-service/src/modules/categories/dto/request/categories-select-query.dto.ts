import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsIn, IsOptional } from 'class-validator';
import { type CategoryRole, CategoryRoleValues } from '@/db/schema';

export class CategoriesSelectQueryDto extends SelectOptionsQueryDto {
  @IsOptional()
  @IsIn(Object.values(CategoryRoleValues))
  role?: CategoryRole;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
