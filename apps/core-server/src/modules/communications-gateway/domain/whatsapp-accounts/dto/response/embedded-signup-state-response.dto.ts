import { ApiProperty } from '@nestjs/swagger';

// Where to send the operator to run the flow. Composed server-side because it pins two things the
// browser must not choose: the fixed origin Meta's redirect-URI list names, and the signed state
// that carries this organization across to it.
export class EmbeddedSignupStateResponseDto {
  @ApiProperty({
    description: 'Absolute URL of the broker page, including the single-use state nonce.',
    example: 'https://api.vrittiai.com/communications/whatsapp/connect?state=Zm9vYmFy',
  })
  url: string;
}
