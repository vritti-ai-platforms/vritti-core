import { PartialType } from '@nestjs/swagger';
import { CreatePlatformPaymentGatewayConfigDto } from './create-platform-payment-gateway-config.dto';

export class UpdatePlatformPaymentGatewayConfigDto extends PartialType(CreatePlatformPaymentGatewayConfigDto) {}
