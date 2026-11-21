import { ApiProperty } from '@nestjs/swagger';

export class OfferingCountsResponseDto {
  @ApiProperty({ description: 'Dimensions the offering varies on', example: 2 })
  dimensionCount: number;

  @ApiProperty({ description: 'Attributes defined on the offering', example: 3 })
  attributeCount: number;

  @ApiProperty({ description: 'Variants of the offering, active and inactive', example: 12 })
  variantCount: number;
}
