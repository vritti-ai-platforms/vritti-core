import { Trim } from '@vritti/api-sdk/decorators';
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

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  name?: string;

  @Trim()
  @IsOptional()
  @IsString()
  description?: string | null;

  @IsUUID()
  salesTaxGroupId: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateOfferingPayloadDto extends UpdateOfferingDto {
  @IsUUID()
  offeringId: string;
}
