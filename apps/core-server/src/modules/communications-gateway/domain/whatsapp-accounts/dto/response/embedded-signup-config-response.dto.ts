import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Public values the browser needs to open the Embedded Signup popup. Served rather than baked into
// the micro-frontend bundle: one remote build serves every environment, and these differ per deployment.
export class EmbeddedSignupConfigResponseDto {
  @ApiProperty({ description: 'Meta app id' })
  appId: string;

  @ApiPropertyOptional({
    description: 'Facebook Login for Business configuration id. Absent until the Meta app is configured.',
  })
  configId: string | null;

  @ApiProperty({ description: 'Graph API version the popup should initialise with', example: 'v25.0' })
  graphVersion: string;

  @ApiProperty({
    description: 'Whether Embedded Signup can be started. False while the configuration id is unset.',
  })
  enabled: boolean;
}
