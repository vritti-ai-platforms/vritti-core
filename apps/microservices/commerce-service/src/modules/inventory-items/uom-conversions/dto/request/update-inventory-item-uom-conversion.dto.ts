import { IsInt, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;
}
