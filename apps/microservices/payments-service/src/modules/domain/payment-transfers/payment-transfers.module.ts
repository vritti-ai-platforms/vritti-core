import { Module } from '@nestjs/common';
import { PaymentTransfersDomainRepository } from './repositories/payment-transfers.repository';
import { PaymentTransfersDomainService } from './services/payment-transfers.service';

@Module({
  providers: [PaymentTransfersDomainService, PaymentTransfersDomainRepository],
  exports: [PaymentTransfersDomainService, PaymentTransfersDomainRepository],
})
export class PaymentTransfersDomainModule {}
