import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { User } from '@/db/schema';

export class UserDto {
  @ApiProperty({ description: 'User unique identifier', example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ description: 'Organisation this user belongs to', example: 'uuid-here' })
  organizationId: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User full name', example: 'Jane Smith' })
  fullName: string;

  @ApiProperty({ description: 'Account status', example: 'ACTIVE', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  status: string;

  @ApiProperty({ description: 'User locale', example: 'en-US' })
  locale: string;

  @ApiProperty({ description: 'User timezone', example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ description: 'Whether user has set a password', example: true })
  hasPassword: boolean;

  @ApiPropertyOptional({ description: 'Phone number', example: '919876543210' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Phone country code', example: 'IN' })
  phoneCountry: string | null;

  @ApiProperty({ description: 'Account creation timestamp', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  // Creates a response DTO from a User entity
  static from(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.organizationId = user.organizationId;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.status = user.status;
    dto.locale = user.locale;
    dto.timezone = user.timezone;
    dto.hasPassword = user.passwordHash !== null;
    dto.phone = user.phone ?? null;
    dto.phoneCountry = user.phoneCountry ?? null;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
