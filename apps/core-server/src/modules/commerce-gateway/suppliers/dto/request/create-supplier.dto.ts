import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreatePrimarySupplierContactDto {
  @ApiProperty({ description: 'Primary contact person name', example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Primary contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Primary contact alternate mobile number' })
  @IsOptional()
  @IsString()
  alternateMobile?: string;

  @ApiPropertyOptional({ description: 'Primary contact email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Primary contact alternate email address' })
  @IsOptional()
  @IsString()
  alternateEmail?: string;

  @ApiPropertyOptional({ description: 'Primary contact designation' })
  @IsOptional()
  @IsString()
  designation?: string;
}

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name', example: 'Acme Foods Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Primary contact details', type: CreatePrimarySupplierContactDto })
  @ValidateNested()
  @Type(() => CreatePrimarySupplierContactDto)
  primaryContact: CreatePrimarySupplierContactDto;

  @ApiPropertyOptional({ description: 'Mailing address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Supplier website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ description: 'GST identification number', example: '22AAAAA0000A1Z5' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;

  @ApiPropertyOptional({ description: 'Payment terms', example: 'Net 30' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Default lead time in days', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
