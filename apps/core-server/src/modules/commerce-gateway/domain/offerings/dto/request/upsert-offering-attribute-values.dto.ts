import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class OfferingAttributeValueInputDto {
  @ApiPropertyOptional({ description: 'Present for a value that already exists; absent for a new one' })
  @IsOptional()
  @IsUUID('7')
  id?: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Code a storefront filters by', example: 'high-protein' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ example: 'Medium' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;
}

export class UpsertOfferingAttributeValuesDto {
  @ApiProperty({ type: [OfferingAttributeValueInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferingAttributeValueInputDto)
  values: OfferingAttributeValueInputDto[];
}
