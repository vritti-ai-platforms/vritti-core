import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePurchaseOrderInvoiceDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: "The supplier's invoice number, unique per supplier", example: 'SBD/INV/2611/0042' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @ApiProperty({ description: 'Date on the invoice', example: '2026-11-07' })
  @IsDateString()
  invoiceDate: string;

  @ApiPropertyOptional({
    description: 'Date tax is determined on (YYYY-MM-DD); the invoice date when omitted',
    example: '2026-11-07',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Internal notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
