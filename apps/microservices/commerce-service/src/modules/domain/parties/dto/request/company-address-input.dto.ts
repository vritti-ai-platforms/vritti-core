import { Trim } from '@vritti/api-sdk/decorators';
import { IsISO31661Alpha2, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CompanyAddressInputDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsNotEmpty()
  @IsISO31661Alpha2()
  countryCode: string;
}
