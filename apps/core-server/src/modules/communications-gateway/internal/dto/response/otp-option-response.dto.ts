import { ApiProperty } from '@nestjs/swagger';

export class OtpAccountOptionDto {
  @ApiProperty({ description: 'WhatsApp account ID' })
  id: string;

  @ApiProperty({ description: 'Human-readable account name' })
  name: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID' })
  wabaId: string;
}

export class OtpPhoneNumberOptionDto {
  @ApiProperty({ description: 'Meta phone number ID — the sender' })
  id: string;

  @ApiProperty({ description: 'Display phone number' })
  displayPhoneNumber: string;

  @ApiProperty({ description: 'Verified name shown to recipients' })
  verifiedName: string;
}

export class OtpTemplateOptionDto {
  @ApiProperty({ description: 'Template name Meta addresses the template by' })
  name: string;

  @ApiProperty({ description: 'Template language code' })
  language: string;

  @ApiProperty({ description: 'Meta review status' })
  status: string;
}
