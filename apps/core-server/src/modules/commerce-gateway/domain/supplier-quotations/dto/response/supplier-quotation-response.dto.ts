import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export const SUPPLIER_QUOTATION_STATUSES = ['DRAFT', 'POSTED'] as const;
export type SupplierQuotationStatus = (typeof SUPPLIER_QUOTATION_STATUSES)[number];

export class SupplierQuotationResponseDto {
  @ApiProperty({ description: 'Quotation ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: "The supplier's quotation reference", example: 'SBD-Q-0411' })
  quotationNumber: string;

  @ApiProperty({ description: 'Date on the quotation' })
  quotationDate: string;

  @ApiProperty({ description: 'Currency every line is priced in (ISO 4217)', example: 'USD' })
  currencyCode: string;

  @ApiProperty({ description: 'First day the quoted prices apply' })
  validFrom: string;

  @ApiPropertyOptional({ description: 'Last day the quoted prices apply', type: String, nullable: true })
  validTo: string | null;

  @ApiPropertyOptional({ description: 'Internal note', type: String, nullable: true })
  note: string | null;

  @ApiProperty({
    description: 'Draft until posted to a site; lines and validity are fixed once posted',
    enum: SUPPLIER_QUOTATION_STATUSES,
  })
  status: SupplierQuotationStatus;

  @ApiProperty({ description: 'Number of quoted lines' })
  itemCount: number;

  @ApiProperty({ description: 'Number of sites it is posted to' })
  siteCount: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class SupplierQuotationItemResponseDto {
  @ApiProperty({ description: 'Line ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Unit the price is for' })
  uomId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiPropertyOptional({ description: "Supplier's code for the item", type: String, nullable: true })
  supplierItemCode: string | null;

  @ApiPropertyOptional({ description: 'Unit symbol', type: String, nullable: true })
  uomSymbol: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Quoted price' })
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'MRP ID', type: String, nullable: true })
  mrpId: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'MRP amount', nullable: true })
  mrp: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Scheme bought quantity', type: Number, nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Scheme free quantity', type: Number, nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether the price includes tax' })
  taxInclusive: boolean;
}

export class SupplierQuotationSiteResponseDto {
  @ApiProperty({ description: 'Posting ID' })
  id: string;

  @ApiProperty({ description: 'Site ID' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name', type: String, nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code', type: String, nullable: true })
  siteCode: string | null;

  @ApiPropertyOptional({ description: 'User who posted it', type: String, nullable: true })
  postedBy: string | null;

  @ApiProperty({ description: 'ISO timestamp it was posted' })
  postedAt: string;
}

export class SupplierQuotationDetailResponseDto extends SupplierQuotationResponseDto {
  @ApiProperty({ type: [SupplierQuotationItemResponseDto] })
  items: SupplierQuotationItemResponseDto[];

  @ApiProperty({ type: [SupplierQuotationSiteResponseDto] })
  sites: SupplierQuotationSiteResponseDto[];
}
