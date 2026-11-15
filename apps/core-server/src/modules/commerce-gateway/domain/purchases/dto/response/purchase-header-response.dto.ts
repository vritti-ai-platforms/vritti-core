import { ApiProperty } from '@nestjs/swagger';
import { PURCHASE_ACTIONS, type PurchaseAction } from '../../constants/purchase.constants';
import { PurchaseResponseDto } from './purchase-response.dto';
import { PurchaseProgressResponseDto } from './purchase-table-row-response.dto';

export class PurchaseHeaderResponseDto extends PurchaseResponseDto {
  @ApiProperty({ description: 'Site name (gateway-enriched)' })
  siteName: string;

  @ApiProperty({ description: 'Site code (gateway-enriched)' })
  siteCode: string;

  @ApiProperty({ description: 'Number of items' })
  itemCount: number;

  @ApiProperty({ description: 'Quotations linked to the purchase, in any status' })
  quotationCount: number;

  @ApiProperty({ description: 'Supplier legs, in any status' })
  supplierCount: number;

  @ApiProperty({ type: () => PurchaseProgressResponseDto, description: 'Unit-free purchase progress across the items' })
  progress: PurchaseProgressResponseDto;

  @ApiProperty({
    description: 'Actions the caller may take on the purchase now',
    enum: PURCHASE_ACTIONS,
    isArray: true,
  })
  availableActions: PurchaseAction[];
}
