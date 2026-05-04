import { ApiProperty } from '@nestjs/swagger';

export class UomDimensionCountResponseDto {
  @ApiProperty({ description: 'Total number of UOM dimensions' })
  count: number;
}
