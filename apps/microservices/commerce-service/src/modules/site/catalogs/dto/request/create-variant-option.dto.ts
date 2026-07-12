import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateVariantOptionDto {
  @IsUUID()
  catalogId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  values: string[];
}
