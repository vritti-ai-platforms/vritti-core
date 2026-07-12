import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { type CategoryRole, CategoryRoleValues } from '@/db/schema';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  // Switch a leaf to a GROUP (only if it has no items) or a GROUP to a leaf (only if it has no children).
  @IsOptional()
  @IsEnum(CategoryRoleValues)
  categoryRole?: CategoryRole;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  defaultTaxGroupId?: string | null;
}
