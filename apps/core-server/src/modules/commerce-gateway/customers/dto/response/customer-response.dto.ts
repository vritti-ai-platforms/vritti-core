import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ description: 'Customer ID' })
  id: string;

  @ApiProperty({ description: 'Customer name', example: 'Jane Doe' })
  name: string;

  @ApiPropertyOptional({ description: 'Phone number', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether the customer is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
