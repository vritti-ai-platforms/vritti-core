import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency, IsCurrencyCode } from '@vritti/api-sdk/money';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { FieldPermission } from '@/rbac/decorators';

// Tells whether any raw invoice line sends an MRP, the condition gating the lines on the MRP edit permission
export function anyLineSetsMrp(lines: unknown): boolean {
  return (
    Array.isArray(lines) &&
    lines.some(
      (line: unknown) =>
        typeof line === 'object' && line !== null && 'mrp' in line && line.mrp !== undefined && line.mrp !== null,
    )
  );
}

export class ReceiveWithInvoiceLineDto {
  @ApiProperty({ description: 'Allocation of an open leg of the supplier at the site' })
  @IsUUID('7')
  allocationId: string;

  @ApiProperty({ description: "Quantity invoiced, in the allocation's unit", example: 20 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: "Quantity supplied free, in the allocation's unit", example: 2 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  freeQty: number;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Invoiced price per unit, in the invoice currency' })
  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Discount on the line' })
  @IsOptional()
  @IsCurrency()
  discountAmount?: CurrencyAmountDto;

  @ApiPropertyOptional({ type: CurrencyAmountDto, description: 'Tax on the line' })
  @IsOptional()
  @IsCurrency()
  taxAmount?: CurrencyAmountDto;

  @Trim()
  @ApiPropertyOptional({
    description: 'Batch number; required when the item is lot-tracked',
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string | null;

  @ApiPropertyOptional({ description: 'Batch expiry date (YYYY-MM-DD); required when the item is lot-tracked' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiryDate must be YYYY-MM-DD' })
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Batch manufacturing date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'manufacturingDate must be YYYY-MM-DD' })
  manufacturingDate?: string;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    description: "Printed MRP per primary unit, in the legal entity's currency; for a lot-tracked item",
  })
  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto;

  @ApiPropertyOptional({ description: "Site location the goods are put at; the invoice's default location otherwise" })
  @IsOptional()
  @IsUUID('7')
  locationId?: string;
}

export class ReceiveWithInvoiceDto {
  @ApiProperty({ description: 'Supplier whose invoice it is' })
  @IsUUID('7')
  supplierId: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: "The supplier's invoice number, unique per supplier", example: 'SBD/INV/2611/0042' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @ApiProperty({ description: 'Date on the invoice (YYYY-MM-DD); the due date follows from it', example: '2026-11-11' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'invoiceDate must be YYYY-MM-DD' })
  invoiceDate: string;

  @ApiPropertyOptional({
    description: 'Date tax is determined on (YYYY-MM-DD); the invoice date when omitted',
    example: '2026-11-11',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate?: string;

  @ApiProperty({ description: "Invoice currency (ISO 4217), one of the supplier's currencies", example: 'INR' })
  @IsCurrencyCode()
  currencyCode: string;

  @ApiPropertyOptional({
    description: "1 unit of the invoice currency in the legal entity's currency; required in another currency",
    example: 83.25,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  exchangeRate?: number;

  @ApiProperty({ description: 'When the goods were received (ISO string)', example: '2026-11-11T10:30:00.000Z' })
  @IsDateString()
  receivedDate: string;

  @ApiProperty({ description: 'Site location the lines are put at unless they name their own' })
  @IsUUID('7')
  defaultLocationId: string;

  @Trim()
  @ApiPropertyOptional({
    description: "Number on the supplier's delivery note (challan)",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Internal notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @FieldPermission([SITE_INVENTORY_ITEMS.mrp.edit], anyLineSetsMrp)
  @ApiProperty({
    type: [ReceiveWithInvoiceLineDto],
    description: "Invoiced lines, one receipt lot (or item) each; a line's MRP needs the MRP edit permission",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveWithInvoiceLineDto)
  lines: ReceiveWithInvoiceLineDto[];
}
