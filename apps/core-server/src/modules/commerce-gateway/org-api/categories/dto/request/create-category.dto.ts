import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { type CategoryRole, CategoryRoleValues } from '../../constants/category-role.constants';

export class CreateCategoryDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Parent category ID (for sub-categories)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'GROUP holds sub-categories; CATEGORY (default) is a leaf that holds inventory items',
    enum: Object.values(CategoryRoleValues),
    default: CategoryRoleValues.CATEGORY,
  })
  @IsOptional()
  @IsIn(Object.values(CategoryRoleValues))
  categoryRole?: CategoryRole;

  @ApiPropertyOptional({ description: 'Display sort order', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the category is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Default tax class for items in this category (required for leaf CATEGORY, omit for GROUP)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  defaultTaxClassId?: string | null;
}
