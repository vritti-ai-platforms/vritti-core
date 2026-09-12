import { ApiProperty } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';

export class TemplateValueInputDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Segment this value contributes to a derived SKU', example: 'm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Label shown to the user', example: 'Medium' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;
}

export class UpsertOfferingDimensionTemplateValuesDto {
  @ApiProperty({
    type: [TemplateValueInputDto],
    description: 'The complete set of values the template should end up with',
  })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TemplateValueInputDto)
  values: TemplateValueInputDto[];
}
