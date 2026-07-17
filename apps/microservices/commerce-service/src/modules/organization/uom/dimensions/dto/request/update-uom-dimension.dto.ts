import { IsCode } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateUomDimensionDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsCode()
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
