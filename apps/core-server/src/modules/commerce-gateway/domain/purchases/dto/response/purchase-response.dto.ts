import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PURCHASE_STATUSES,
  PURCHASE_STEPS,
  type PurchaseStatus,
  type PurchaseStep,
} from '../../constants/purchase.constants';

export class PurchaseResponseDto {
  @ApiProperty({ description: 'Purchase ID' })
  id: string;

  @ApiProperty({ description: 'Purchase number', example: 'PUR-202611-0001' })
  purchaseNumber: string;

  @ApiProperty({ description: 'Furthest stage the purchase reached', enum: PURCHASE_STEPS })
  step: PurchaseStep;

  @ApiProperty({ description: 'Purchase status', enum: PURCHASE_STATUSES })
  status: PurchaseStatus;

  @ApiProperty({ description: 'Site the purchase is for' })
  siteId: string;

  @ApiProperty({ description: 'Legal entity the purchase belongs to' })
  legalEntityId: string;

  @ApiProperty({ description: 'Whether supplier quotations are collected before sourcing' })
  quotationsRequired: boolean;

  @ApiProperty({ description: 'Suppliers that must have posted a quotation to complete quotations' })
  minQuotations: number;

  @ApiPropertyOptional({ description: 'Notes', type: String, nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'When the items were submitted', type: String, nullable: true })
  submittedAt: string | null;

  @ApiPropertyOptional({ description: 'When every leg closed', type: String, nullable: true })
  completedAt: string | null;

  @ApiPropertyOptional({ description: 'When the purchase was cancelled', type: String, nullable: true })
  cancelledAt: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string;
}
