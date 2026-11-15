import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateSupplierInvoiceDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: "The supplier's invoice number, unique per supplier", example: 'SBD/INV/2611/0042' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @ApiProperty({ description: 'Date on the invoice (YYYY-MM-DD); the due date follows from it', example: '2026-11-07' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'invoiceDate must be YYYY-MM-DD' })
  invoiceDate: string;

  @ApiPropertyOptional({
    description: 'Date tax is determined on (YYYY-MM-DD); the invoice date when omitted',
    example: '2026-11-07',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate?: string;

  @ApiPropertyOptional({
    description: "Invoice currency (ISO 4217), one of the supplier's currencies; the supplier's own when omitted",
    example: 'INR',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiPropertyOptional({
    description:
      "1 unit of the invoice currency in the legal entity's currency; forced to 1 in that currency, required otherwise",
    example: 83.25,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  exchangeRate?: number;

  @Trim()
  @ApiPropertyOptional({ description: 'Internal notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
