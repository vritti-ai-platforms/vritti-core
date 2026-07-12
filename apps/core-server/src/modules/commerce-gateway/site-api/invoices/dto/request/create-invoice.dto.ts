import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Line item description', example: 'Basmati Rice 25kg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ description: 'Quantity', example: 10 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 1200.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Tax amount for this item', example: 216.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Reference to source item (e.g. PO item)' })
  @IsOptional()
  @IsUUID()
  referenceItemId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice type', enum: ['PAYABLE', 'RECEIVABLE'], example: 'PAYABLE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Unique invoice number', example: 'INV-2026-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  invoiceNumber: string;

  @ApiProperty({ description: 'Party type', enum: ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'], example: 'SUPPLIER' })
  @IsString()
  @IsNotEmpty()
  partyType: string;

  @ApiPropertyOptional({ description: 'Party entity ID' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiProperty({ description: 'Party display name', example: 'Acme Foods Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  partyName: string;

  @ApiPropertyOptional({ description: 'Source reference type', example: 'PURCHASE_ORDER' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Source reference entity ID' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Discount amount', example: 500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Initial status override', enum: ['DRAFT', 'ISSUED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Issue date (YYYY-MM-DD)', example: '2026-04-10' })
  @IsOptional()
  @IsString()
  issuedDate?: string;

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)', example: '2026-05-10' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Invoice line items', type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
