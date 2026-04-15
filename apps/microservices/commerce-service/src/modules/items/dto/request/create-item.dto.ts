import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import type { CatalogItemType } from '@/db/schema';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

export class CreateItemDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsEnum(['PRODUCT', 'SERVICE'])
  type: CatalogItemType;

  @IsOptional()
  @IsString()
  @Matches(ITEM_CODE_PATTERN, {
    message: 'code must contain only uppercase letters, numbers, and hyphen (-).',
  })
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  taxGroupId?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
