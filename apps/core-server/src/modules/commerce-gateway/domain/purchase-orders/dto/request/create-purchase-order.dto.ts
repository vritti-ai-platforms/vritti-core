import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches } from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID('7')
  supplierId: string;

  @ApiPropertyOptional({
    description: "One of the supplier's currencies the PO is in; the supplier's default when omitted",
    example: 'USD',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiProperty({ description: 'Order date (YYYY-MM-DD)', example: '2026-04-10' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'orderDate must be YYYY-MM-DD' })
  orderDate: string;

  @ApiProperty({
    description:
      'Date tax is determined on (YYYY-MM-DD); every line follows it unless set on the line. May be before the order date',
    example: '2026-04-10',
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({
    description: "1 unit of the PO currency in the legal entity's currency; stored as 1 when the two match",
    example: 83.5,
  })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  exchangeRate: number;
}
