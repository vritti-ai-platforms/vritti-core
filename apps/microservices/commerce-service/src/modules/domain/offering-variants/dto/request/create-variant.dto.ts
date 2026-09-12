import { Trim } from '@vritti/api-sdk/decorators';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVariantDto {
  @IsUUID()
  offeringId: string;

  @IsUUID()
  salesUomId: string;

  // Exactly one value per dimension — a variant is a complete combination
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  valueIds: string[];

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalSku?: string | null;
}
