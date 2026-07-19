import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateReorderDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint: number;
}
