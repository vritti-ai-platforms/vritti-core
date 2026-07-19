import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID()
  partyId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsNotEmpty()
  @IsCurrencyCode()
  currencyCode: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

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
