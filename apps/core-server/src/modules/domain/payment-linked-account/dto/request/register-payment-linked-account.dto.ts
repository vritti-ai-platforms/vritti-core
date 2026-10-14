import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// Bounds mirror payments-service's CreateLinkedAccountDto, so a registration accepted here is never refused there

export class PaymentLinkedAccountAddressDto {
  @ApiProperty({ example: '12 MG Road' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  street1: string;

  @ApiPropertyOptional({ example: 'Indiranagar' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  street2?: string;

  @ApiProperty({ example: 'Bengaluru' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Karnataka' })
  @Trim({ nullify: false })
  @IsString()
  @Length(2, 32)
  state: string;

  @ApiProperty({ example: '560038' })
  @Trim({ nullify: false })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'postalCode must be a 6-digit PIN code' })
  postalCode: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code', example: 'IN' })
  @Trim({ nullify: false })
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be an ISO alpha-2 code' })
  country: string;
}

export class RegisterPaymentLinkedAccountDto {
  @ApiProperty({ description: 'Split-enabled gateway config that collects the payments', example: 'uuid-here' })
  @IsUUID()
  collectorConfigId: string;

  @ApiProperty({ description: 'Bank account the linked account settles into', example: 'uuid-here' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ example: 'accounts@acme.example' })
  @Trim({ nullify: false })
  @IsEmail()
  @MaxLength(132)
  email: string;

  @ApiProperty({ example: '9876543210' })
  @Trim({ nullify: false })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'phone must be 8 to 15 digits' })
  phone: string;

  @ApiProperty({ example: 'Acme Foods Private Limited' })
  @Trim({ nullify: false })
  @IsString()
  @Length(4, 200)
  legalBusinessName: string;

  @ApiProperty({ description: 'Provider business type', example: 'private_limited' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  businessType: string;

  @ApiProperty({ example: 'Asha Rao' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactName: string;

  @ApiPropertyOptional({
    description: 'Provider business category; required by some providers (e.g. Razorpay)',
    example: 'food',
  })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Provider business subcategory; required by some providers (e.g. Razorpay)',
    example: 'restaurant',
  })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @ApiProperty({ type: PaymentLinkedAccountAddressDto })
  @ValidateNested()
  @Type(() => PaymentLinkedAccountAddressDto)
  address: PaymentLinkedAccountAddressDto;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @Trim()
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'pan must be a valid PAN' })
  pan?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @Trim()
  @IsOptional()
  @IsString()
  @Matches(/^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z0-9]{2}$/, { message: 'gst must be a valid GSTIN' })
  gst?: string;
}
