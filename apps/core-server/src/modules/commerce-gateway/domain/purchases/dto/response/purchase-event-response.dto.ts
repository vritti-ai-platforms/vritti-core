import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PURCHASE_EVENT_ACTIONS, type PurchaseEventAction } from '../../constants/purchase.constants';

export class PurchaseEventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'Action that was taken', enum: PURCHASE_EVENT_ACTIONS })
  action: PurchaseEventAction;

  @ApiPropertyOptional({ description: 'Leg the action was taken on', type: String, nullable: true })
  purchaseSupplierId: string | null;

  @ApiPropertyOptional({ description: "Name of that leg's supplier", type: String, nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ description: 'Step before the action', type: String, nullable: true })
  stepBefore: string | null;

  @ApiPropertyOptional({ description: 'Step after the action', type: String, nullable: true })
  stepAfter: string | null;

  @ApiPropertyOptional({ description: 'Kind of document the action created', type: String, nullable: true })
  documentType: string | null;

  @ApiPropertyOptional({ description: 'Document the action created', type: String, nullable: true })
  documentId: string | null;

  @ApiPropertyOptional({ description: 'Reason given for the action', type: String, nullable: true })
  reason: string | null;

  @ApiPropertyOptional({ description: 'User who took the action', type: String, nullable: true })
  actorId: string | null;

  @ApiPropertyOptional({ description: 'Name of the user who took the action', type: String, nullable: true })
  actorName: string | null;

  @ApiProperty({ description: 'When the action was taken' })
  createdAt: string;
}
