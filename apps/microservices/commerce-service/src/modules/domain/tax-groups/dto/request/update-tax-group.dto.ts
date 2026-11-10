import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type TaxTreatment, taxTreatmentEnum } from '@/db/schema';

export class UpdateTaxGroupDto {
  @IsUUID('7')
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code?: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(taxTreatmentEnum.enumValues)
  treatment?: TaxTreatment;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  legalText?: string | null;
}
