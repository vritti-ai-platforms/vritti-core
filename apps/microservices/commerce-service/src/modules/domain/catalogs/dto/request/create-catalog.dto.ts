import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCatalogDto {
  @IsString()
  @MaxLength(255)
  @Trim()
  name: string;

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
}
