import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class SupplierItemPriceResponseDto {
  @ApiProperty({ description: 'Price record ID' })
  id: string;

  @ApiProperty({ description: 'Supplier item ID the price belongs to' })
  supplierItemId: string;

  @ApiPropertyOptional({ description: 'Site the price applies to; null = general price', nullable: true })
  siteId: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price for this validity window' })
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty', nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty', nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Date the price becomes valid (ISO date)' })
  validFrom: string;

  @ApiPropertyOptional({ description: 'Date the price expires (ISO date); null = open-ended', nullable: true })
  validTo: string | null;

  @ApiProperty({ description: 'How the price was captured', enum: ['QUOTATION', 'MANUAL', 'IMPORT'] })
  source: string;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
