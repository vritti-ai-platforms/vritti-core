import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PURCHASE_ACTIONS,
  PURCHASE_SUMMARIES,
  type PurchaseAction,
  type PurchaseSummary,
} from '../../constants/purchase.constants';
import { PurchaseResponseDto } from './purchase-response.dto';
import { PurchaseProgressResponseDto } from './purchase-table-row-response.dto';

export class PurchaseBlockersResponseDto {
  @ApiPropertyOptional({ description: 'Why the suppliers cannot be submitted now', type: String, nullable: true })
  submit: string | null;

  @ApiPropertyOptional({ description: 'Why the purchase cannot be closed now', type: String, nullable: true })
  close: string | null;

  @ApiPropertyOptional({ description: 'Why the purchase cannot be cancelled now', type: String, nullable: true })
  cancel: string | null;

  @ApiPropertyOptional({ description: 'Why the purchase cannot be deleted now', type: String, nullable: true })
  delete: string | null;
}

export class PurchaseDetailResponseDto extends PurchaseResponseDto {
  @ApiProperty({ description: 'Site name (gateway-enriched)' })
  siteName: string;

  @ApiProperty({ description: 'Site code (gateway-enriched)' })
  siteCode: string;
}

export class PurchaseCountsResponseDto {
  @ApiProperty({ description: 'Number of items' })
  itemCount: number;

  @ApiProperty({ description: 'Supplier legs, in any status' })
  supplierCount: number;

  @ApiProperty({ description: 'Quotations linked to the purchase, in any status' })
  quotationCount: number;
}

export class PurchaseProgressSummaryResponseDto extends PurchaseProgressResponseDto {
  @ApiPropertyOptional({
    description: 'Where an open purchase stands, from its progress; null once completed or cancelled',
    enum: PURCHASE_SUMMARIES,
    nullable: true,
  })
  summary: PurchaseSummary | null;
}

export class PurchaseActionsResponseDto {
  @ApiProperty({
    description: 'Actions the caller may take on the purchase now',
    enum: PURCHASE_ACTIONS,
    isArray: true,
  })
  availableActions: PurchaseAction[];

  @ApiProperty({ type: () => PurchaseBlockersResponseDto, description: 'Why each blocked action is blocked' })
  blockers: PurchaseBlockersResponseDto;
}
