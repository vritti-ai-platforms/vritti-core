import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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

export class UpsertDimensionTemplateValuesDto {
  @IsUUID()
  templateId: string;

  // The complete set the template should end up with — the service replaces rather than diffs.
  // Both keys are uniquely constrained per template, so a repeat is rejected rather than dropped.
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique((entry: TemplateValueInput) => entry.code, { message: 'Each value needs its own code.' })
  @ArrayUnique((entry: TemplateValueInput) => entry.value, { message: 'Each value must be distinct.' })
  @ValidateNested({ each: true })
  @Type(() => TemplateValueInput)
  values: TemplateValueInput[];
}
