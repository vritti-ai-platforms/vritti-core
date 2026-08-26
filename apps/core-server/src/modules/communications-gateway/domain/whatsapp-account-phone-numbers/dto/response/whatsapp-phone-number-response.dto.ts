import { ApiProperty } from '@nestjs/swagger';

export class WhatsappPhoneNumberResponseDto {
  @ApiProperty({ description: 'Meta phone number ID', example: '1259833303888701' })
  id: string;

  @ApiProperty({ example: '+91 94917 00322' })
  displayPhoneNumber: string;

  @ApiProperty({ description: 'Display name shown to WhatsApp users', example: 'Vritti AI' })
  verifiedName: string;

  @ApiProperty({ nullable: true, example: 'VERIFIED', description: 'Meta ownership verification status' })
  codeVerificationStatus: string | null;

  @ApiProperty({ nullable: true, example: 'GREEN', description: 'Meta messaging quality rating' })
  qualityRating: string | null;

  @ApiProperty({ nullable: true, example: 'CLOUD_API' })
  platformType: string | null;

  @ApiProperty({ nullable: true, example: 'STANDARD' })
  throughputLevel: string | null;

  @ApiProperty({ nullable: true, example: 'APPROVED', description: 'Meta display name review status' })
  nameStatus: string | null;
}
