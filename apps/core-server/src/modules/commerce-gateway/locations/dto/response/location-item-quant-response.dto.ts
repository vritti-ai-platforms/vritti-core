import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

// Per-quant breakdown row for a single item within a location (cost batch level).
export class LocationItemQuantResponseDto {
  @ApiProperty() quantId: string;
  @ApiPropertyOptional({ nullable: true }) lotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiProperty() quantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) unitCost: CurrencyAmountDto | null;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) quantValue: CurrencyAmountDto | null;
}
