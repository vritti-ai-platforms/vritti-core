import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatusValues } from '@/db/schema';

export class UpdateUserInternalDto {
  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsEnum(UserStatusValues)
  status?: string;

  @ApiPropertyOptional({ example: 'en-US' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  timezone?: string;

  // Deliberately not IsNotEmpty — an empty string or null is how the caller clears the phone
  @ApiPropertyOptional({ description: 'Phone number (E.164), empty or null to clear', example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}
