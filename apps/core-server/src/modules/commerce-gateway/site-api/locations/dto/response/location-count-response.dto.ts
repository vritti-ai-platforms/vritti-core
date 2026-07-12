import { ApiProperty } from '@nestjs/swagger';

export class LocationCountResponseDto {
  @ApiProperty({ description: 'Total number of storage locations' })
  count: number;
}
