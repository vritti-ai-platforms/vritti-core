import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUomDimensionDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Unique code — a single lowercase word (hyphens allowed)', example: 'mass' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Display name', example: 'Mass' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string | null;
}
