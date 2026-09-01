import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// An active provider the SMS OTP config screen may pick — the org's own rows plus platform rows
export class SmsProviderOptionDto {
  @ApiProperty({ description: 'SMS provider ID' })
  id: string;

  @ApiProperty({ description: 'Human-readable provider name' })
  name: string;

  @ApiProperty({ description: 'Registry code (CONSOLE, MSG91, TWILIO)' })
  provider: string;

  @ApiProperty({ enum: ['PLATFORM', 'CLIENT'], description: 'Whether Vritti or the organization manages it' })
  type: string;

  @ApiPropertyOptional({ nullable: true, description: 'Default originator, overridable per app' })
  senderId: string | null;
}
