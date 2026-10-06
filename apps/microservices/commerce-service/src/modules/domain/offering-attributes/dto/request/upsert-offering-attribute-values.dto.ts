import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class OfferingAttributeValueInput {
  @IsOptional()
  @IsUUID('7')
  id?: string;

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

export class UpsertOfferingAttributeValuesDto {
  @IsUUID('7')
  attributeId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferingAttributeValueInput)
  values: OfferingAttributeValueInput[];
}
