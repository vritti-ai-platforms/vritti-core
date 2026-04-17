import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateSupplierContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{5,14}$/, { message: 'Phone must be a valid international number (e.g. +919876543210).' })
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: 'Contact alternate phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternatePhone?: string;

  @ApiPropertyOptional({ description: 'Contact email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Contact alternate email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  alternateEmail?: string;

  @ApiPropertyOptional({ description: 'Contact designation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @ApiPropertyOptional({ description: 'Contact notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Set as primary contact', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
