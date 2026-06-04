import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUomDimensionDto {
  @ApiProperty({ description: 'Unique code (uppercase, A-Z 0-9 _)', example: 'MASS' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'code must start with uppercase letter' })
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Mass' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
