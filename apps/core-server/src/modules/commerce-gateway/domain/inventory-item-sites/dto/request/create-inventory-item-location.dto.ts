import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateInventoryItemLocationDto {
  @ApiProperty({ description: 'Storage location the item is fixed to' })
  @IsUUID('7')
  locationId: string;

  @ApiPropertyOptional({ description: 'Whether new putaway of the item into this location is blocked', default: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
