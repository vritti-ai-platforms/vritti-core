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
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;
}

export class CreateOfferingAttributeWithValuesAndTemplateDto {
  @IsUUID('7')
  offeringId: string;

  @IsUUID('7')
  templateId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OfferingAttributeValueInputDto)
  values: OfferingAttributeValueInputDto[];
}
