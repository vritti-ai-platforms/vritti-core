import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemUomConversionDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsUUID('7')
  uomId: string;

  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @IsInt()
  @Min(1)
  uomQty: number;
}
