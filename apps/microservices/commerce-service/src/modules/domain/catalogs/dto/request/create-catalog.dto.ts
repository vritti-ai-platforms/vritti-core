import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCatalogDto {
  @IsString()
  @MaxLength(255)
  @Trim()
  name: string;

  @IsOptional()
  @IsUUID('all')
  ownerLegalEntityId?: string | null;

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}
