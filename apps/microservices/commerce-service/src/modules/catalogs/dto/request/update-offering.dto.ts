import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import type { FulfilmentType } from '@/db/schema';

export class UpdateOfferingDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  variantOptionIds?: string[];

  @IsOptional()
  @IsEnum(['STOCK', 'SERVICE', 'COMPOSITE'])
  fulfilmentType?: FulfilmentType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsUUID()
  salesTaxGroupId?: string | null;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
