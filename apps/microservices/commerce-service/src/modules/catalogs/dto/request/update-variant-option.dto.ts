import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateVariantOptionDto {
  @IsUUID()
  optionId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}
