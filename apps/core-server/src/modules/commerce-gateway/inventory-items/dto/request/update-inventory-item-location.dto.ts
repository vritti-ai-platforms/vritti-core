import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateInventoryItemLocationDto {
  @ApiProperty({ description: 'Minimum stock level threshold for reorder at this location' })
  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
