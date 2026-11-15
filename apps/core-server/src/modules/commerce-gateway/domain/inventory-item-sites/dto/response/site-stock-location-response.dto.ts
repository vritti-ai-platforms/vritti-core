import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SiteStockLocationResponseDto {
  @ApiProperty({ description: 'Location ID', format: 'uuid' })
  locationId: string;

  @ApiProperty({ description: 'Location name', example: 'Bin 12' })
  locationName: string;

  @ApiProperty({ description: 'Location path from the site root', example: 'Zone A › Rack 3 › Bin 12' })
  locationPath: string;

  @ApiProperty({ description: 'Quantity on hand at this location, in the primary unit', example: 3200 })
  quantity: number;

  @ApiProperty({ description: 'Number of lots on hand at this location', example: 2 })
  lotCount: number;

  @ApiPropertyOptional({
    description: 'Earliest expiry of the lots on hand at this location; null when the stock is not lot-tracked',
    format: 'date-time',
    nullable: true,
  })
  earliestExpiry: string | null;
}
