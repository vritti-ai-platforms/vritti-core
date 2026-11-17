import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PURCHASE_STATUSES,
  PURCHASE_SUMMARIES,
  type PurchaseStatus,
  type PurchaseSummary,
} from '../../constants/purchase.constants';

export class PurchaseProgressSegmentsResponseDto {
  @ApiProperty({ description: 'Percent of the requested quantity invoiced', example: 20 })
  invoiced: number;

  @ApiProperty({ description: 'Percent received but not yet invoiced', example: 15.5 })
  received: number;

  @ApiProperty({ description: 'Percent on an open inbound delivery, not yet received', example: 10 })
  inTransit: number;

  @ApiProperty({ description: 'Percent on a live purchase order, not yet in transit or received', example: 20 })
  ordered: number;

  @ApiProperty({ description: 'Percent allocated to a supplier, not yet ordered', example: 14.5 })
  allocated: number;

  @ApiProperty({ description: 'Percent not yet allocated (the track); the six segments sum to 100', example: 20 })
  unallocated: number;
}

export class PurchaseProgressResponseDto {
  @ApiProperty({ description: 'Number of items, each weighing 1/N of the bar', example: 5 })
  itemCount: number;

  @ApiProperty({
    type: () => PurchaseProgressSegmentsResponseDto,
    description: 'Per-item pipeline shares averaged over the items, in percent (one decimal, summing to 100)',
  })
  segments: PurchaseProgressSegmentsResponseDto;
}

export class PurchaseTableRowResponseDto {
  @ApiProperty({ description: 'Purchase ID' })
  id: string;

  @ApiProperty({ description: 'Purchase number', example: 'PUR-202611-0001' })
  purchaseNumber: string;

  @ApiProperty({ description: 'Purchase status', enum: PURCHASE_STATUSES })
  status: PurchaseStatus;

  @ApiPropertyOptional({
    description: 'Where an open purchase stands, from its progress; null once completed or cancelled',
    enum: PURCHASE_SUMMARIES,
    nullable: true,
  })
  summary: PurchaseSummary | null;

  @ApiProperty({ description: 'Site the purchase is for' })
  siteId: string;

  @ApiProperty({ description: 'Site name (gateway-enriched, not sortable)' })
  siteName: string;

  @ApiProperty({ description: 'Site code (gateway-enriched, not sortable)' })
  siteCode: string;

  @ApiProperty({ description: 'Number of items' })
  itemCount: number;

  @ApiProperty({ type: () => PurchaseProgressResponseDto, description: 'Unit-free purchase progress across the items' })
  progress: PurchaseProgressResponseDto;

  @ApiProperty({ description: 'Created at' })
  createdAt: string;
}
