import { IsInt, IsUUID, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @IsUUID('7')
  id: string;

  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;
}
