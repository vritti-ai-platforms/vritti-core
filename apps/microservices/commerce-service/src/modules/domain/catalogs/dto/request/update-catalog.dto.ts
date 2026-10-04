import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCatalogDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Trim()
  name?: string;

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
