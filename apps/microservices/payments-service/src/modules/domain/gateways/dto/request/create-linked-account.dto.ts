import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type {
  CreateLinkedAccountInput,
  LinkedAccountAddress,
  LinkedAccountBank,
  ResumeLinkedAccountInput,
} from '../../gateway-transport';

export class LinkedAccountAddressDto implements LinkedAccountAddress {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  street1: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  street2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @Length(2, 32)
  state: string;

  @Matches(/^\d{6}$/, { message: 'postalCode must be a 6-digit PIN code' })
  postalCode: string;

  @IsString()
  @Length(2, 64)
  country: string;
}

export class LinkedAccountBankDto implements LinkedAccountBank {
  @Matches(/^\d{6,20}$/, { message: 'accountNumber must be 6 to 20 digits' })
  accountNumber: string;

  @Matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, { message: 'ifscCode must be a valid IFSC code' })
  ifscCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  beneficiaryName: string;
}

export class LinkedAccountDetailsDto implements CreateLinkedAccountInput {
  @IsString()
  @Length(1, 512)
  referenceId: string;

  @IsEmail()
  @MaxLength(132)
  email: string;

  @Matches(/^\+?[\d\s-]{8,20}$/, { message: 'phone must be 8 to 15 digits' })
  phone: string;

  @IsString()
  @Length(4, 200)
  legalBusinessName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  businessType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @ValidateNested()
  @Type(() => LinkedAccountAddressDto)
  address: LinkedAccountAddressDto;

  @IsOptional()
  @Matches(/^[A-Za-z]{5}\d{4}[A-Za-z]$/, { message: 'pan must be a valid PAN' })
  pan?: string;

  @IsOptional()
  @Matches(/^[0-3]\d[A-Za-z]{5}\d{4}[A-Za-z]\d[A-Za-z0-9]{2}$/, { message: 'gst must be a valid GSTIN' })
  gst?: string;

  @ValidateNested()
  @Type(() => LinkedAccountBankDto)
  bank: LinkedAccountBankDto;
}

export class ResumeLinkedAccountDto implements ResumeLinkedAccountInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerAccountId: string;

  @IsObject()
  providerData: Record<string, string>;
}

export class CreateLinkedAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode: string;

  // Decrypted by core for this one call — the shape is owned by the transport, never stored here
  @IsObject()
  credentials: Record<string, string>;

  @ValidateNested()
  @Type(() => LinkedAccountDetailsDto)
  account: LinkedAccountDetailsDto;

  // What an earlier attempt already created at the provider; the transport resumes from the step that failed
  @IsOptional()
  @ValidateNested()
  @Type(() => ResumeLinkedAccountDto)
  resume?: ResumeLinkedAccountDto;
}
