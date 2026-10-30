import { ApiProperty } from '@nestjs/swagger';
import { PaymentGatewayConfigDto } from '../entity/payment-gateway-config.dto';

export class PaymentGatewayConfigsPageResponseDto {
  @ApiProperty({ type: [PaymentGatewayConfigDto] })
  result: PaymentGatewayConfigDto[];

  @ApiProperty()
  count: number;
}
