import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact alternate mobile number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternateMobile?: string;

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
