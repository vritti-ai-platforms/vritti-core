import { Module } from '@nestjs/common';
import { PaymentIntentsDomainRepository } from './repositories/payment-intents.repository';
import { PaymentIntentsDomainService } from './services/payment-intents.service';

@Module({
  providers: [PaymentIntentsDomainService, PaymentIntentsDomainRepository],
  exports: [PaymentIntentsDomainService, PaymentIntentsDomainRepository],
})
export class PaymentIntentsDomainModule {}
