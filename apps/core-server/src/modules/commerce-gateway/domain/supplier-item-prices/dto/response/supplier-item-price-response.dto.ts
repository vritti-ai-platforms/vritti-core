import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class SupplierItemPriceResponseDto {
  @ApiProperty({ description: 'Price record ID' })
  id: string;

  @ApiProperty({ description: 'Supplier item ID the price belongs to' })
  supplierItemId: string;

  @ApiProperty({ description: 'Legal entity of the supplier' })
  legalEntityId: string;

  @ApiProperty({
    description: "Site the price applies to; null for the legal entity's price",
    nullable: true,
    type: String,
  })
  siteId: string | null;

  @ApiProperty({ description: "SITE for a site's own price, LE for the legal entity's", enum: ['SITE', 'LE'] })
  ownerScope: 'SITE' | 'LE';

  @ApiProperty({ description: 'Name of the site or legal entity that owns the price' })
  ownerName: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price for this validity window' })
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty', nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty', nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether the quoted price includes tax' })
  taxInclusive: boolean;

  @ApiProperty({ description: 'Date the price becomes valid (ISO date)' })
  validFrom: string;

  @ApiPropertyOptional({ description: 'Date the price expires (ISO date); null = open-ended', nullable: true })
  validTo: string | null;

  @ApiProperty({ description: 'How the price was captured', enum: ['QUOTATION', 'MANUAL'] })
  source: string;

  @ApiPropertyOptional({
    description: 'Quotation posting that created the price; it then changes only through the quotation',
    type: String,
    nullable: true,
  })
  quotationSiteId: string | null;

  @ApiPropertyOptional({ description: 'MRP this price was agreed against', nullable: true })
  mrpId: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Amount of that MRP', nullable: true })
  mrp: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Why the price was set or changed', nullable: true })
  note: string | null;

  @ApiPropertyOptional({ description: 'User who created the price', nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
