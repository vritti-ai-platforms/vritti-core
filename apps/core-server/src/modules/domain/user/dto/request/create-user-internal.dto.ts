import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserInternalDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name', example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ description: 'User phone number (E.164)', example: '+919876543210' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Phone country code (ISO 3166-1 alpha-2)', example: 'IN' })
  @IsString()
  @IsOptional()
  @MaxLength(5)
  phoneCountry?: string;

  @ApiProperty({ description: 'User locale', example: 'en-IN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  locale: string;

  @ApiProperty({ description: 'User timezone', example: 'Asia/Kolkata' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  timezone: string;
}
