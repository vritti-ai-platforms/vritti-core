import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class OptionValueDto {
  @ApiProperty({ description: 'Value text', example: 'Small' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class SaveOptionDto {
  @ApiProperty({ description: 'Option name', example: 'Size' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Option values', type: [OptionValueDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OptionValueDto)
  values: OptionValueDto[];
}

export class SaveOptionsDto {
  @ApiProperty({ description: 'Array of options to save', type: [SaveOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveOptionDto)
  options: SaveOptionDto[];
}
