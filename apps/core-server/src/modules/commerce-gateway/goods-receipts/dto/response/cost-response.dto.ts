import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class GoodsReceiptCostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty({ enum: ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] })
  categoryKind: string;

  @ApiProperty({ type: () => CurrencyAmountDto })
  totalAmount: CurrencyAmountDto;

  @ApiProperty({ enum: ['by_value', 'by_quantity', 'equal'] })
  distributionMethod: string;

  @ApiPropertyOptional({ nullable: true })
  vendorRef: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'User id or null' })
  createdBy: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ description: 'True when downstream consumption blocks edit/delete' })
  isLocked: boolean;
}

export class CostKindBreakdownEntryResponseDto {
  @ApiProperty({ enum: ['ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER'] })
  kind: string;

  @ApiProperty({ type: () => CurrencyAmountDto })
  amount: CurrencyAmountDto;

  @ApiProperty()
  percentage: number;
}

export class GoodsReceiptCostsResponseDto {
  @ApiPropertyOptional({ nullable: true })
  costAssociatedAt: string | null;

  @ApiProperty({ type: () => CurrencyAmountDto })
  totalAmount: CurrencyAmountDto;

  @ApiProperty({ type: () => CurrencyAmountDto })
  perUnitCost: CurrencyAmountDto;

  @ApiProperty({ type: [CostKindBreakdownEntryResponseDto] })
  kindBreakdown: CostKindBreakdownEntryResponseDto[];

  @ApiProperty({
    description: 'TableResponse-shaped cost rows',
    type: () => Object,
  })
  costRows: { result: GoodsReceiptCostResponseDto[]; count: number };
}

export class CostAllocationResponseDto {
  @ApiProperty()
  quantId: string;

  @ApiProperty()
  locationId: string;

  @ApiPropertyOptional({ nullable: true })
  locationName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lotId: string | null;

  @ApiPropertyOptional({ nullable: true })
  lotNumber: string | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: () => CurrencyAmountDto })
  allocatedAmount: CurrencyAmountDto;
}
