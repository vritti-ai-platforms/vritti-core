import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import {
  ArrayUnique,
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
} from 'class-validator';

export class CreatePurchaseSupplierInvoiceDto {
  @ApiProperty({ description: 'Supplier invoicing its open legs at the site' })
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

  @ApiPropertyOptional({
    type: [String],
    description: 'Purchases to invoice; every open leg of the supplier at the site when omitted',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('7', { each: true })
  purchaseIds?: string[];
}
