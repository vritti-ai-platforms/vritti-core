import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateVariantOptionDto {
  @ApiPropertyOptional({ description: 'Variant option name', example: 'Size' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Variant option values', type: [String], example: ['S', 'M', 'L'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}
