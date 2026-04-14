import { ApiProperty } from '@nestjs/swagger';

export class StorageLocationCountResponseDto {
  @ApiProperty({ description: 'Total number of storage locations' })
  count: number;
}
