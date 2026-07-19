import { Module } from '@nestjs/common';
import { PaymentsDomainRepository } from './repositories/payments.repository';
import { PaymentsDomainService } from './services/payments.service';

@Module({
  providers: [PaymentsDomainService, PaymentsDomainRepository],
  exports: [PaymentsDomainService],
})
export class PaymentsDomainModule {}
