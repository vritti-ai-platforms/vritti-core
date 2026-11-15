import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';
import { SUPPLIER_INVOICE_LINE_TYPES, type SupplierInvoiceLineType } from '../response/supplier-invoice-response.dto';

export class SupplierInvoiceLineDto {
  @ApiProperty({
    description: 'ITEM invoices a received lot (or receipt item without lots); CHARGE is a landed cost',
    enum: SUPPLIER_INVOICE_LINE_TYPES,
  })
  @IsIn(SUPPLIER_INVOICE_LINE_TYPES)
  lineType: SupplierInvoiceLineType;

  @ApiPropertyOptional({ description: 'Order line invoiced; required for an ITEM line' })
  @ValidateIf((line: SupplierInvoiceLineDto) => line.lineType === 'ITEM')
  @IsUUID('7')
  purchaseOrderItemId?: string;

  @ApiPropertyOptional({ description: 'Posted receipt item of that order line invoiced; required for an ITEM line' })
  @ValidateIf((line: SupplierInvoiceLineDto) => line.lineType === 'ITEM')
  @IsUUID('7')
  goodsReceiptItemId?: string;

  @ApiPropertyOptional({
    description: 'Receipt lot invoiced; required when the receipt item has lots',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsUUID('7')
  goodsReceiptLotId?: string | null;

  @ApiPropertyOptional({
    description: "Quantity invoiced, in the order line's unit; required for an ITEM line",
    example: 20,
  })
  @ValidateIf((line: SupplierInvoiceLineDto) => line.lineType === 'ITEM')
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  invoicedQty?: number;

  @ApiPropertyOptional({
    description: "Quantity supplied free, in the order line's unit; required for an ITEM line",
    example: 2,
  })
  @ValidateIf((line: SupplierInvoiceLineDto) => line.lineType === 'ITEM')
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  freeQty?: number;

  @ApiPropertyOptional({
    description: 'Active cost category charged, not the item category; required for a CHARGE line',
  })
  @ValidateIf((line: SupplierInvoiceLineDto) => line.lineType === 'CHARGE')
  @IsUUID('7')
  costCategoryId?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Line description', nullable: true, example: 'Freight' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @ApiProperty({
    type: CurrencyAmountDto,
    description: 'Invoiced price per unit on an ITEM line, the charge amount on a CHARGE line; in the invoice currency',
  })
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
}
