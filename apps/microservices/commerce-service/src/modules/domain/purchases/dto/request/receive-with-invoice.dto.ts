import { Trim } from '@vritti/api-sdk/decorators';
import { CurrencyAmountDto, IsCurrency, IsCurrencyCode } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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
  Min,
  ValidateNested,
} from 'class-validator';

export class ReceiveWithInvoiceLineDto {
  @IsUUID('7')
  allocationId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  freeQty: number;

  @IsCurrency()
  unitPrice: CurrencyAmountDto;

  @IsOptional()
  @IsCurrency()
  discountAmount?: CurrencyAmountDto;

  @IsOptional()
  @IsCurrency()
  taxAmount?: CurrencyAmountDto;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiryDate must be YYYY-MM-DD' })
  expiryDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'manufacturingDate must be YYYY-MM-DD' })
  manufacturingDate?: string;

  @IsOptional()
  @IsCurrency()
  mrp?: CurrencyAmountDto;

  @IsOptional()
  @IsUUID('7')
  locationId?: string;
}

export class ReceiveWithInvoiceDto {
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

  @IsDateString()
  receivedDate: string;

  @IsUUID('7')
  defaultLocationId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveWithInvoiceLineDto)
  lines: ReceiveWithInvoiceLineDto[];
}
