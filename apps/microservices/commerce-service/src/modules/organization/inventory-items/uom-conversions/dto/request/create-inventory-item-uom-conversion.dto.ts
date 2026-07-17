import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemUomConversionDto {
  @IsUUID()
  inventoryItemId: string;

  @IsUUID()
  uomId: string;

  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;
}
