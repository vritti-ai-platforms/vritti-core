import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateInventoryItemLocationDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
