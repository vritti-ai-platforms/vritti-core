import { ApiProperty } from '@nestjs/swagger';

/**
 * Whether the console may offer WhatsApp sign-up, and nothing else.
 *
 * Deliberately down to one flag. The Meta app id, login configuration id and Graph version used to
 * ship here because the browser opened the popup itself; since the flow moved to a server-side
 * redirect they are read only by the broker, so sending them would be telling the client things it
 * has no use for.
 */
export class EmbeddedSignupConfigResponseDto {
  @ApiProperty({
    description:
      'Whether Embedded Signup can be started. False while META_EMBEDDED_SIGNUP_CONFIG_ID is unset — the one prerequisite a deployment can be missing.',
  })
  enabled: boolean;
}
