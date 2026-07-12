import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateVariantOptionDto {
  @ApiProperty({ description: 'Variant option name', example: 'Size' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Variant option values', type: [String], example: ['S', 'M', 'L'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  values: string[];
}
