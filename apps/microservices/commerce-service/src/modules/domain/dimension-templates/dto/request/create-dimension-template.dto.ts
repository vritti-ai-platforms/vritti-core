import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDimensionTemplateDto {
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
}
