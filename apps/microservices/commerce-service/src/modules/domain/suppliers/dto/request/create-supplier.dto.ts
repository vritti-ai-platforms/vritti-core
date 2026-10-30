import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID('7')
  partyId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsNotEmpty()
  @IsCurrencyCode()
  currencyCode: string;

  // Further currencies the supplier trades in; the default is always among them
  @IsOptional()
  @IsArray()
  @IsCurrencyCode({ each: true })
  currencyCodes?: string[];

  @IsOptional()
  @IsUUID('7')
  defaultPaymentTermId?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  purchasingBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentBlocked?: boolean;

  @Trim()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  orderEmail?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  orderPhone?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
