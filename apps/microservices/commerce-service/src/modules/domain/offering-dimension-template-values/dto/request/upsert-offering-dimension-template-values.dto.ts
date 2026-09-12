import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class TemplateValueInput {
  // Copied onto an offering dimension value, where it becomes a segment of the derived SKU
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

export class UpsertOfferingDimensionTemplateValuesDto {
  @IsUUID()
  templateId: string;

  // The complete set the template should end up with — the service replaces rather than diffs
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TemplateValueInput)
  values: TemplateValueInput[];
}
