import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Credentials never appear in a response — hasCredentials says whether they exist, not what they are
export class SmsProviderResponseDto {
  @ApiProperty({ description: 'SMS provider ID' })
  id: string;

  @ApiProperty({ enum: ['PLATFORM', 'CLIENT'], description: 'PLATFORM rows are Vritti-managed and read-only here' })
  type: string;

  @ApiProperty({ enum: ['CONSOLE', 'MSG91', 'TWILIO'], description: 'Registry code of the provider implementation' })
  provider: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiPropertyOptional({ nullable: true, description: 'Default originator (sender id / from number)' })
  senderId: string | null;

  @ApiProperty({ description: 'Whether the provider can be picked for sending' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether credentials are stored for this row' })
  hasCredentials: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
