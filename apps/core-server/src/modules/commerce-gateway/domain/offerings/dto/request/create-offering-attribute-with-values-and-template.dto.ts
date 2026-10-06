import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class OfferingAttributeValueInputDto {
  @ApiProperty({ example: 'red' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @ApiProperty({ example: 'Red' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;
}

export class CreateOfferingAttributeWithValuesAndTemplateDto {
  // The template the values were taken from. Required: the microservice checks every submitted
  // value really belongs to it, so without this a caller could invent values and claim a template.
  @ApiProperty({ format: 'uuid', description: 'Template the values were chosen from' })
  @IsUUID('7')
  templateId: string;

  @ApiProperty({ example: 'colour' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @ApiProperty({ example: 'Colour' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ type: [OfferingAttributeValueInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OfferingAttributeValueInputDto)
  values: OfferingAttributeValueInputDto[];
}
