import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateInventoryItemLocationDto {
  @IsUUID('7')
  id: string;

  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
