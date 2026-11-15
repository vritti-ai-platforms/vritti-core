import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateInventoryItemLocationDto {
  @ApiProperty({ description: 'Whether new putaway of the item into this location is blocked' })
  @IsBoolean()
  isBlocked: boolean;
}
