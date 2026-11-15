import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseSupplierInvoiceDto {
  @IsUUID('7')
  supplierId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'invoiceDate must be YYYY-MM-DD' })
  invoiceDate: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate?: string;

  @IsCurrencyCode()
  currencyCode: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  exchangeRate?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('7', { each: true })
  purchaseIds?: string[];
}
