import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUomDimensionDto {
  @ApiProperty({ description: 'Unique code — a single lowercase word (hyphens allowed)', example: 'mass' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9-]*$/, { message: 'code must be a single lowercase word (hyphens allowed)' })
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
