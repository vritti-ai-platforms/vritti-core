import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { User } from '@/db/schema';

export class ProfileDto {
  @ApiProperty({ description: 'User unique identifier', example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User full name', example: 'Jane Smith' })
  fullName: string;

  @ApiPropertyOptional({ description: 'User display name', example: 'Jane' })
  displayName: string | null;

  @ApiProperty({ description: 'Account status', example: 'ACTIVE', enum: ['PENDING', 'ACTIVE', 'SUSPENDED'] })
  status: string;

  @ApiProperty({ description: 'Whether user has set a password', example: true })
  hasPassword: boolean;

  @ApiProperty({ description: 'Locale/language preference', example: 'en' })
  locale: string;

  @ApiProperty({ description: 'Timezone preference', example: 'UTC' })
  timezone: string;

  @ApiProperty({ description: 'Account creation timestamp', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiPropertyOptional({ description: 'Last login timestamp', example: '2024-06-01T08:00:00Z' })
  lastLoginAt: string | null;

  @ApiPropertyOptional({
    description: 'Time-limited URL for the profile photo, null when none is set',
    example: 'https://<account>.r2.cloudflarestorage.com/org-acme/…?X-Amz-Signature=…',
  })
  profilePictureUrl: string | null;

  // Creates a ProfileDto from a User entity
  static from(user: User, profilePictureUrl: string | null = null): ProfileDto {
    const dto = new ProfileDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.displayName = user.displayName ?? null;
    dto.status = user.status;
    dto.hasPassword = user.passwordHash !== null;
    dto.locale = user.locale;
    dto.timezone = user.timezone;
    dto.createdAt = user.createdAt.toISOString();
    dto.lastLoginAt = user.lastLoginAt?.toISOString() ?? null;
    dto.profilePictureUrl = profilePictureUrl;
    return dto;
  }
}
