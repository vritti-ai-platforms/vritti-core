import { Module } from '@nestjs/common';
import { PaymentGatewayConfigDomainModule } from '../payment-gateway-config/payment-gateway-config.module';
import { PaymentLinkedAccountDomainRepository } from './repositories/payment-linked-account.repository';
import { PaymentLinkedAccountDomainService } from './services/payment-linked-account.service';

@Module({
  imports: [PaymentGatewayConfigDomainModule],
  providers: [PaymentLinkedAccountDomainService, PaymentLinkedAccountDomainRepository],
  exports: [PaymentLinkedAccountDomainService, PaymentLinkedAccountDomainRepository],
})
export class PaymentLinkedAccountDomainModule {}
