import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceListResponseDto {
  @ApiProperty({ description: 'Price list ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiProperty({ description: 'Price list name', example: 'Lunch Menu' })
  name: string;

  @ApiProperty({ description: 'Price list code', example: 'PL-LUNCH' })
  code: string;

  @ApiPropertyOptional({ description: 'Price list description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Whether price list is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of assigned inventory items' })
  assignedItemsCount: number;

  @ApiProperty({ description: 'Number of assigned terminals' })
  assignedTerminalsCount: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
