import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUomDimensionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'code must be uppercase letters, digits, underscores' })
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
