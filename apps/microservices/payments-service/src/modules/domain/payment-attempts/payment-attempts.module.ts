import { Module } from '@nestjs/common';
import { PaymentAttemptsDomainRepository } from './repositories/payment-attempts.repository';

@Module({
  providers: [PaymentAttemptsDomainRepository],
  exports: [PaymentAttemptsDomainRepository],
})
export class PaymentAttemptsDomainModule {}
