import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsISO31661Alpha2, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class PersonAddressInputDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Address line 1', example: '12 MG Road' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'State / region' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Postal / ZIP code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ description: 'Country (ISO-2)', example: 'IN' })
  @IsNotEmpty()
  @IsISO31661Alpha2()
  countryCode: string;
}
