import { ApiProperty } from '@nestjs/swagger';
import {
  PURCHASE_LEG_STATUSES,
  PURCHASE_LEG_STEPS,
  type PurchaseLegStatus,
  type PurchaseLegStep,
} from '../../constants/purchase.constants';
import { PurchaseAllocationResponseDto } from './purchase-allocation-response.dto';

export class PurchaseSourcingAllocationResponseDto extends PurchaseAllocationResponseDto {
  @ApiProperty({ description: 'Supplier of the leg the allocation belongs to' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: 'Furthest step the leg reached', enum: PURCHASE_LEG_STEPS })
  legStep: PurchaseLegStep;

  @ApiProperty({ description: 'Leg status', enum: PURCHASE_LEG_STATUSES })
  legStatus: PurchaseLegStatus;

  @ApiProperty({ description: 'Whether the allocation can still change: its leg is open in sourcing' })
  isEditable: boolean;
}
