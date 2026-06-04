import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { CreateInvoiceItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Updated party type', enum: ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'] })
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional({ description: 'Updated party entity ID' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional({ description: 'Updated party display name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  partyName?: string;

  @ApiPropertyOptional({ description: 'Updated reference type' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Updated reference ID' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Updated discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Updated status', enum: ['DRAFT', 'ISSUED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Updated payment terms' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Updated issue date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  issuedDate?: string;

  @ApiPropertyOptional({ description: 'Updated due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Replacement line items (replaces all existing)', type: [CreateInvoiceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
