import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddPurchaseOrderItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  orderedQuantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number | null;
}
