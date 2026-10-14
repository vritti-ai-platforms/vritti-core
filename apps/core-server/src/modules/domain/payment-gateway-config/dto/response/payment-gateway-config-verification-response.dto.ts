import { ApiProperty } from '@nestjs/swagger';
import { PaymentGatewayConfigVerificationDto } from './payment-gateway-config-verification.dto';

export class PaymentGatewayConfigVerificationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Payment gateway config "Storefront Razorpay" verified successfully.' })
  message: string;

  @ApiProperty({ type: PaymentGatewayConfigVerificationDto })
  data: PaymentGatewayConfigVerificationDto;
}
