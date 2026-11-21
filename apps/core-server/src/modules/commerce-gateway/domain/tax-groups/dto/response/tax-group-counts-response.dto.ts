import { ApiProperty } from '@nestjs/swagger';

export class TaxGroupCountsResponseDto {
  @ApiProperty({ description: 'Rates in the group', example: 12 })
  rateCount: number;

  @ApiProperty({ description: 'Tax classes mapped to the group, past and future mappings included', example: 3 })
  classCount: number;
}
