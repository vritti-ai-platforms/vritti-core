import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateSupplierContactDto {
  @ApiPropertyOptional({ description: 'Contact name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{5,14}$/, { message: 'Phone must be a valid international number (e.g. +919876543210).' })
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: 'Contact alternate phone number', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternatePhone?: string | null;

  @ApiPropertyOptional({ description: 'Contact email address', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ description: 'Contact alternate email address', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  alternateEmail?: string | null;

  @ApiPropertyOptional({ description: 'Contact designation', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string | null;

  @ApiPropertyOptional({ description: 'Contact notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Set this as primary contact' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Set contact active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
