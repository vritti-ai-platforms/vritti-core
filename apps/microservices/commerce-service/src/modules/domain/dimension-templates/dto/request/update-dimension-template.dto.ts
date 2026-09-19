import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDimensionTemplateDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
