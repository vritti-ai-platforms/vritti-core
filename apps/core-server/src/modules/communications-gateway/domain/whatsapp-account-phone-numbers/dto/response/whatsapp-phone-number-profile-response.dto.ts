import { ApiProperty } from '@nestjs/swagger';

export class WhatsappPhoneNumberProfileResponseDto {
  @ApiProperty({ nullable: true, description: 'Short status line shown on the profile' })
  about: string | null;

  @ApiProperty({ nullable: true })
  address: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true, description: 'CDN URL of the current profile picture' })
  profilePictureUrl: string | null;

  @ApiProperty({ nullable: true, description: 'Business category (Meta vertical)' })
  vertical: string | null;

  @ApiProperty({ type: [String] })
  websites: string[];
}
