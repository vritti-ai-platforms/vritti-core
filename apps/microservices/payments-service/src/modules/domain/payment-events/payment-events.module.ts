import { Module } from '@nestjs/common';
import { PaymentEventsDomainRepository } from './repositories/payment-events.repository';

@Module({
  providers: [PaymentEventsDomainRepository],
  exports: [PaymentEventsDomainRepository],
})
export class PaymentEventsDomainModule {}
