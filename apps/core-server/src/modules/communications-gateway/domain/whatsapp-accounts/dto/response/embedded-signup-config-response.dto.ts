import { ApiProperty } from '@nestjs/swagger';

export class EmbeddedSignupConfigResponseDto {
  @ApiProperty({
    description:
      'Whether Embedded Signup can be started. False while META_EMBEDDED_SIGNUP_CONFIG_ID is unset — the one prerequisite a deployment can be missing.',
  })
  enabled: boolean;
}
