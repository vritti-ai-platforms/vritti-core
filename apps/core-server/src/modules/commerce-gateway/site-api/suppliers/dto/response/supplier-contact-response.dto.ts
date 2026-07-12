import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierContactResponseDto {
  @ApiProperty({ description: 'Supplier contact ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Contact name' })
  name: string;

  @ApiProperty({ description: 'Contact phone number' })
  phone: string;

  @ApiPropertyOptional({ description: 'Contact alternate phone number', nullable: true })
  alternatePhone: string | null;

  @ApiPropertyOptional({ description: 'Contact email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Contact alternate email address', nullable: true })
  alternateEmail: string | null;

  @ApiPropertyOptional({ description: 'Contact designation', nullable: true })
  designation: string | null;

  @ApiPropertyOptional({ description: 'Contact notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether this contact is primary' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether this contact is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
