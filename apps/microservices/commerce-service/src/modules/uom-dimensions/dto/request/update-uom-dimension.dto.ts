import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUomDimensionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'code must be uppercase letters, digits, underscores' })
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
