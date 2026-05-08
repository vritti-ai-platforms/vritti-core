import { IsInt, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @IsInt()
  @Min(1)
  numerator: number;

  @IsInt()
  @Min(1)
  denominator: number;
}
