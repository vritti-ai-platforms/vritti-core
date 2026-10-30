import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSupplierQuotationDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: "The supplier's quotation reference" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  quotationNumber?: string;

  @ApiPropertyOptional({ description: 'Date on the quotation' })
  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  @ApiPropertyOptional({
    description: "One of the supplier's currencies; only while the quotation is a draft without lines",
    example: 'USD',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'First day the quoted prices apply; only while the quotation is a draft' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Last day the quoted prices apply; only while the quotation is a draft',
    nullable: true,
  })
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
