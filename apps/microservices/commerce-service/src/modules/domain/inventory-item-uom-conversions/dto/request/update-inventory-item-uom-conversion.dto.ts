import { IsInt, IsUUID, Min } from 'class-validator';

export class UpdateInventoryItemUomConversionDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;
}
