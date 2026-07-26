import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { type CategoryRole, CategoryRoleValues } from '../../constants/category-role.constants';

export class UpdateCategoryDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Updated category name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Parent category ID (null to make root-level)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Switch role: leaf→GROUP requires no items; GROUP→leaf requires no sub-categories',
    enum: Object.values(CategoryRoleValues),
  })
  @IsOptional()
  @IsIn(Object.values(CategoryRoleValues))
  categoryRole?: CategoryRole;

  @ApiPropertyOptional({ description: 'Updated display sort order' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Updated active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Updated default tax class applied to items in this category' })
  @IsOptional()
  @IsUUID()
  defaultTaxClassId?: string;
}
