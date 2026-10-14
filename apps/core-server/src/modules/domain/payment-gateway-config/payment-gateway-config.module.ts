import { Module } from '@nestjs/common';
import { PaymentCredentialsCryptoService } from '@/services/payment-credentials-crypto.service';
import { PaymentGatewayConfigDomainRepository } from './repositories/payment-gateway-config.repository';
import { PaymentGatewayConfigDomainService } from './services/payment-gateway-config.service';

@Module({
  providers: [PaymentGatewayConfigDomainService, PaymentGatewayConfigDomainRepository, PaymentCredentialsCryptoService],
  exports: [PaymentGatewayConfigDomainService, PaymentGatewayConfigDomainRepository],
})
export class PaymentGatewayConfigDomainModule {}
