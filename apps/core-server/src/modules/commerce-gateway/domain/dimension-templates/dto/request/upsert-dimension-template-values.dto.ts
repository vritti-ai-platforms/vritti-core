import { ApiProperty } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';

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

export class UpsertDimensionTemplateValuesDto {
  @ApiProperty({
    type: [TemplateValueInputDto],
    description: 'The complete set of values the template should end up with',
  })
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique((entry: TemplateValueInputDto) => entry.code, { message: 'Each value needs its own code.' })
  @ArrayUnique((entry: TemplateValueInputDto) => entry.value, { message: 'Each value must be distinct.' })
  @ValidateNested({ each: true })
  @Type(() => TemplateValueInputDto)
  values: TemplateValueInputDto[];
}
