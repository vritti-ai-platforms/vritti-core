import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsOptional, IsUUID } from 'class-validator';

export class UpsertInventoryItemMrpDto {
  @ApiProperty({ type: CurrencyAmountDto, description: 'Suggested MRP amount (with currency)' })
  @IsCurrency()
  amount: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Lot the MRP was sourced from', nullable: true })
  @IsOptional()
  @IsUUID()
  sourceLotId?: string | null;
}
