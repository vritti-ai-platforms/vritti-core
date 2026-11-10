import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
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

export class UpdateSupplierInvoiceDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: "The supplier's invoice number, unique per supplier" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Date on the invoice', example: '2026-11-07' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional({
    description: 'Date tax is determined on (YYYY-MM-DD); changes only while the invoice is a draft',
    example: '2026-11-07',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate?: string;

  @ApiPropertyOptional({
    description: "1 unit of the invoice currency in the legal entity's currency; 1 when the two are the same",
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
