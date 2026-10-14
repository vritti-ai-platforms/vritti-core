import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePaymentGatewayConfigDto } from './create-payment-gateway-config.dto';

export class UpdatePaymentGatewayConfigDto extends PartialType(
  OmitType(CreatePaymentGatewayConfigDto, ['legalEntityId', 'bankAccountId'] as const),
) {}
