import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { FulfilmentTypeValues } from '@/db/schema';

export class CreateOfferingDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsEnum(FulfilmentTypeValues)
  fulfilmentType: keyof typeof FulfilmentTypeValues;

  @IsUUID()
  taxClassId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
