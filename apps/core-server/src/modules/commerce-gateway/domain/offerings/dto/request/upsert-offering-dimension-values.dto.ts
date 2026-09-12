import { ApiProperty } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';

export class OfferingDimensionValueInputDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Segment this value contributes to a derived SKU', example: 'm' })
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

export class UpsertOfferingDimensionValuesDto {
  @ApiProperty({ type: [OfferingDimensionValueInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfferingDimensionValueInputDto)
  values: OfferingDimensionValueInputDto[];
}
