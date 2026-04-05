import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OptionValueInput {
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class OptionInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OptionValueInput)
  values: OptionValueInput[];
}

export class SaveOptionsDto {
  @IsUUID()
  itemId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionInput)
  options: OptionInput[];
}
