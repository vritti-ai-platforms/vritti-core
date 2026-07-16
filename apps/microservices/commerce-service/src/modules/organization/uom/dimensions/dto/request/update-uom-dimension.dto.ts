import { IsCode } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUomDimensionDto {
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
