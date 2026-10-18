import { ApiProperty } from '@nestjs/swagger';

export class EmbeddedSignupStateResponseDto {
  @ApiProperty({
    description: 'Absolute URL of the broker page, including the single-use state nonce.',
    example: 'https://api.vrittiai.com/communications/whatsapp/connect?state=Zm9vYmFy',
  })
  url: string;
}
