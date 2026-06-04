import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserWebhookDto {
  @ApiProperty({ description: 'Nexus organisation ID', example: 'uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name', example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ description: 'User phone number (E.164 digits)', example: '919876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Phone country code (ISO 3166-1 alpha-2)', example: 'IN' })
  @IsString()
  @IsOptional()
  phoneCountry?: string;
}
