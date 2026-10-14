import { ApiProperty } from '@nestjs/swagger';

export class PaymentGatewayOptionDto {
  @ApiProperty({ example: 'razorpay' })
  code: string;

  @ApiProperty({
    description: 'The credential fields a config for this gateway must carry',
    example: ['key_id', 'key_secret'],
    type: [String],
  })
  credentialFields: string[];

  @ApiProperty({ description: 'Whether the gateway can split a collected payment to linked accounts', example: true })
  supportsSplit: boolean;
}
