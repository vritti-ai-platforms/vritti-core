import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateReorderDto {
  @IsUUID('7')
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint: number;
}
