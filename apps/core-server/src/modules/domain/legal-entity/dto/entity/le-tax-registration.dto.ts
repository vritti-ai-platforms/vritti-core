import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LeTaxRegistration } from '@/db/schema';

export class LeTaxRegistrationDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  organizationId: string;

  @ApiProperty({ example: 'uuid-here' })
  legalEntityId: string;

  @ApiProperty({ example: '29AAACA1234F1Z5' })
  taxNumber: string;

  @ApiPropertyOptional({ example: 'Karnataka', nullable: true })
  region: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  // Creates a DTO from a LeTaxRegistration entity
  static from(registration: LeTaxRegistration): LeTaxRegistrationDto {
    const dto = new LeTaxRegistrationDto();
    dto.id = registration.id;
    dto.organizationId = registration.organizationId;
    dto.legalEntityId = registration.legalEntityId;
    dto.taxNumber = registration.taxNumber;
    dto.region = registration.region ?? null;
    dto.isActive = registration.isActive;
    dto.createdAt = registration.createdAt.toISOString();
    dto.updatedAt = registration.updatedAt.toISOString();
    return dto;
  }
}
