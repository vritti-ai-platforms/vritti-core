import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSupplierContactDto {
  @ApiPropertyOptional({ description: 'Contact name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Contact alternate mobile number', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternateMobile?: string | null;

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
