import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierQuotationDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: "The supplier's quotation reference", example: 'SBD-Q-0411' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  quotationNumber: string;

  @ApiProperty({ description: 'Date on the quotation', example: '2026-11-01' })
  @IsDateString()
  quotationDate: string;

  @ApiPropertyOptional({
    description: "One of the supplier's currencies every line is priced in; the supplier's default when omitted",
    example: 'USD',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiProperty({ description: 'First day the quoted prices apply at the sites it is posted to', example: '2026-11-01' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ description: 'Last day the quoted prices apply; open-ended when empty', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Internal note', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
