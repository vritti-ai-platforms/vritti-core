import { ApiProperty } from '@nestjs/swagger';

export class TaxClassCountsResponseDto {
  @ApiProperty({
    description: 'Tax group mappings of the class in every country, past and future included',
    example: 4,
  })
  groupCount: number;
}
