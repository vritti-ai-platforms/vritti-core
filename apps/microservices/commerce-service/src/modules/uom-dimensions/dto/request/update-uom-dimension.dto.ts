import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUomDimensionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9-]*$/, { message: 'code must be a single lowercase word (hyphens allowed)' })
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
