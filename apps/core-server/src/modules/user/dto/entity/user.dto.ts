import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ description: 'User role', example: 'SUPPORT', enum: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] })
  role: string;

  @ApiProperty({ description: 'Account status', example: 'ACTIVE', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  status: string;

  @ApiProperty({ description: 'Whether user has set a password', example: true })
  hasPassword: boolean;

  @ApiProperty({ description: 'Account creation timestamp', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  // Creates a response DTO from a User entity
  static from(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.organizationId = user.organizationId;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.role = user.role;
    dto.status = user.status;
    dto.hasPassword = user.passwordHash !== null;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
