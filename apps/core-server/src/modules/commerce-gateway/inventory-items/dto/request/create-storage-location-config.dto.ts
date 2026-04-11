import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateStorageLocationConfigDto {
  @ApiProperty({ description: 'Storage location ID' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ description: 'Minimum stock level threshold for reorder at this location' })
  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
