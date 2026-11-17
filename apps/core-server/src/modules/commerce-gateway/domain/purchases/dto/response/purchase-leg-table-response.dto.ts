import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import {
  PURCHASE_LEG_STATUSES,
  PURCHASE_LEG_STEPS,
  type PurchaseLegStatus,
  type PurchaseLegStep,
} from '../../constants/purchase.constants';
import { PurchaseLegDocumentsResponseDto, PurchaseLegResponseDto } from './purchase-leg-response.dto';

export class PurchaseLegTableResponseDto extends TableResponseDto<PurchaseLegResponseDto> {
  @ApiProperty({ type: [PurchaseLegResponseDto] })
  declare result: PurchaseLegResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}

export class PurchaseLegCountResponseDto {
  @ApiProperty({ description: 'Leg step', enum: PURCHASE_LEG_STEPS })
  step: PurchaseLegStep;

  @ApiProperty({ description: 'Leg status', enum: PURCHASE_LEG_STATUSES })
  status: PurchaseLegStatus;

  @ApiProperty({ description: 'Legs in the step and status' })
  count: number;

  @ApiProperty({ description: 'Lines allocated to those legs' })
  lineCount: number;
}

export class PurchaseSupplierDocumentsResponseDto {
  @ApiProperty({ description: 'Leg ID' })
  legId: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ type: () => PurchaseLegDocumentsResponseDto })
  documents: PurchaseLegDocumentsResponseDto;
}
