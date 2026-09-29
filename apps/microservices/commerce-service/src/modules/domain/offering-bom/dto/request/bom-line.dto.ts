import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class AddBomLineDto {
  @IsUUID()
  variantId: string;

  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;

  // May differ from how the item is stocked; resolved through inventory_item_uom_conversions
  @IsUUID()
  uomId: string;
}

export class UpdateBomLineDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsUUID()
  uomId?: string;
}
