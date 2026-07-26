import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateReorderDto {
  @ApiProperty({ description: 'Inventory item whose reorder point is being updated' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Reorder point in the base UOM' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  reorderPoint: number;
}
