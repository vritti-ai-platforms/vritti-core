import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const DISTRIBUTION_METHODS = ['by_value', 'by_quantity', 'equal'] as const;
export type DistributionMethod = (typeof DISTRIBUTION_METHODS)[number];

export class AssociateGoodsReceiptCostDto {
  @ApiProperty({ description: 'Cost category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Total amount in major units' })
  @IsCurrency()
  totalAmount: CurrencyAmountDto;

  @ApiProperty({ enum: DISTRIBUTION_METHODS })
  @IsEnum(DISTRIBUTION_METHODS)
  distributionMethod: DistributionMethod;

  @ApiPropertyOptional({ description: 'Invoice / vendor reference', example: 'INV-FR-99' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendorRef?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
