import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency } from '@vritti/api-sdk/money';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';
import { type SupplierInvoiceLineType, SupplierInvoiceLineTypeValues } from '@/db/schema';

export class SupplierInvoiceLineFieldsDto {
  @IsIn(Object.values(SupplierInvoiceLineTypeValues))
  lineType: SupplierInvoiceLineType;

  @ValidateIf((line: SupplierInvoiceLineFieldsDto) => line.lineType === SupplierInvoiceLineTypeValues.ITEM)
  @IsUUID('7')
  purchaseOrderItemId?: string;

  @ValidateIf((line: SupplierInvoiceLineFieldsDto) => line.lineType === SupplierInvoiceLineTypeValues.ITEM)
  @IsUUID('7')
  goodsReceiptItemId?: string;

  @IsOptional()
  @IsUUID('7')
  goodsReceiptLotId?: string | null;

  @ValidateIf((line: SupplierInvoiceLineFieldsDto) => line.lineType === SupplierInvoiceLineTypeValues.ITEM)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  invoicedQty?: number;

  @ValidateIf((line: SupplierInvoiceLineFieldsDto) => line.lineType === SupplierInvoiceLineTypeValues.ITEM)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  freeQty?: number;

  @ValidateIf((line: SupplierInvoiceLineFieldsDto) => line.lineType === SupplierInvoiceLineTypeValues.CHARGE)
  @IsUUID('7')
  costCategoryId?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @IsOptional()
  @IsCurrency()
  discountAmount?: CurrencyAmountDto;

  @IsOptional()
  @IsCurrency()
  taxAmount?: CurrencyAmountDto;
}
