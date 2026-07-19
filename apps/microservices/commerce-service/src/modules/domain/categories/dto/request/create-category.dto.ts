import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { type CategoryRole, CategoryRoleValues } from '@/db/schema';

export class CreateCategoryDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  // GROUP holds sub-categories; CATEGORY (default) is a leaf that holds inventory items.
  @IsOptional()
  @IsEnum(CategoryRoleValues)
  categoryRole?: CategoryRole;

  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  defaultTaxClassId?: string | null;
}
