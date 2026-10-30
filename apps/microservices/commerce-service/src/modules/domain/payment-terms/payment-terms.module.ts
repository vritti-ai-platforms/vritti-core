import { Module } from '@nestjs/common';
import { PaymentTermsDomainRepository } from './repositories/payment-terms.repository';
import { PaymentTermsDomainService } from './services/payment-terms.service';

@Module({
  providers: [PaymentTermsDomainService, PaymentTermsDomainRepository],
  exports: [PaymentTermsDomainService, PaymentTermsDomainRepository],
})
export class PaymentTermsDomainModule {}
