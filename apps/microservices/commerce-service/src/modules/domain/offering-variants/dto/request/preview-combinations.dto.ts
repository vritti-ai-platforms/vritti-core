import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class CombinationAxisDto {
  @IsUUID('7')
  dimensionId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  valueIds: string[];
}

export class PreviewCombinationsDto {
  @IsUUID('7')
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CombinationAxisDto)
  axes: CombinationAxisDto[];
}
