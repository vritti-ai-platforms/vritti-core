import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUomDimensionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9-]*$/, { message: 'code must be a single lowercase word (hyphens allowed)' })
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
