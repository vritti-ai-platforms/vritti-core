import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class AddBomLineDto {
  @IsUUID('7')
  variantId: string;

  @IsUUID('7')
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;

  // May differ from how the item is stocked; resolved through inventory_item_uom_conversions
  @IsUUID('7')
  uomId: string;
}

export class UpdateBomLineDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
