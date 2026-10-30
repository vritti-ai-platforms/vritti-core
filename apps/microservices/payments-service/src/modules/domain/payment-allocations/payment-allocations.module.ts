import { Module } from '@nestjs/common';
import { PaymentAllocationsDomainRepository } from './repositories/payment-allocations.repository';

@Module({
  providers: [PaymentAllocationsDomainRepository],
  exports: [PaymentAllocationsDomainRepository],
})
export class PaymentAllocationsDomainModule {}
