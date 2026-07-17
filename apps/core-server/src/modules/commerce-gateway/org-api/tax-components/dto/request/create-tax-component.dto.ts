import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTaxComponentDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code within the org', example: 'gst-standard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable name', example: 'GST Standard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Taxing authority level', enum: ['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'], example: 'STATE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'])
  authorityLevel: string;

  @ApiProperty({ description: 'Whether the tax is recoverable (input credit)' })
  @IsBoolean()
  isRecoverable: boolean;

  @ApiProperty({ description: 'Whether the tax is a withholding tax' })
  @IsBoolean()
  isWithholding: boolean;

  @ApiProperty({ description: 'Whether the tax component is selectable' })
  @IsBoolean()
  isActive: boolean;
}
