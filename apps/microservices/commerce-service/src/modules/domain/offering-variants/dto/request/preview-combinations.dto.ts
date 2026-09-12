import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class CombinationAxisDto {
  @IsUUID()
  dimensionId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  valueIds: string[];
}

export class PreviewCombinationsDto {
  @IsUUID()
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CombinationAxisDto)
  axes: CombinationAxisDto[];
}
