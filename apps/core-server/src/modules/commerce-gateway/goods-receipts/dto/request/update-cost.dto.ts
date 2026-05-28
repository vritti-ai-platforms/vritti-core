import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { DISTRIBUTION_METHODS, type DistributionMethod } from './associate-cost.dto';

export class UpdateGoodsReceiptCostDto {
  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Total amount in major units' })
  @IsOptional()
  @ValidateNested()
  @IsCurrency()
  @Type(() => CurrencyAmountDto)
  totalAmount?: CurrencyAmountDto;

  @ApiPropertyOptional({ enum: DISTRIBUTION_METHODS })
  @IsOptional()
  @IsEnum(DISTRIBUTION_METHODS)
  distributionMethod?: DistributionMethod;

  @ApiPropertyOptional({ description: 'Invoice / vendor reference', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendorRef?: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
