import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class VariantCombinationInput {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  valueIds: string[];
}

export class GenerateVariantsDto {
  @IsUUID('7')
  offeringId: string;

  // Applies to every variant in this batch, and to any inventory item created by auto-link
  @IsUUID('7')
  salesUomId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantCombinationInput)
  combinations: VariantCombinationInput[];

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  namePrefix?: string | null;
}
