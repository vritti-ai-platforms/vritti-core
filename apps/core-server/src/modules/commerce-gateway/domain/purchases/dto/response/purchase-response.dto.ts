import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PURCHASE_STATUSES, type PurchaseStatus } from '../../constants/purchase.constants';

export class PurchaseResponseDto {
  @ApiProperty({ description: 'Purchase ID' })
  id: string;

  @ApiProperty({ description: 'Purchase number', example: 'PUR-202611-0001' })
  purchaseNumber: string;

  @ApiProperty({ description: 'Purchase status', enum: PURCHASE_STATUSES })
  status: PurchaseStatus;

  @ApiProperty({ description: 'Site the purchase is for' })
  siteId: string;

  @ApiProperty({ description: 'Legal entity the purchase belongs to' })
  legalEntityId: string;

  @ApiProperty({ description: 'Whether an item needs posted quotations before a supplier of it is submitted' })
  quotationsRequired: boolean;

  @ApiProperty({ description: 'Suppliers that must have posted a quotation for an item' })
  minQuotations: number;

  @ApiPropertyOptional({ description: 'Notes', type: String, nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'When a supplier was first submitted', type: String, nullable: true })
  submittedAt: string | null;

  @ApiPropertyOptional({ description: 'When every leg closed', type: String, nullable: true })
  completedAt: string | null;

  @ApiPropertyOptional({ description: 'When the purchase was cancelled', type: String, nullable: true })
  cancelledAt: string | null;

  @ApiPropertyOptional({ description: 'Why the purchase was cancelled', type: String, nullable: true })
  cancelReason: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string;
}
