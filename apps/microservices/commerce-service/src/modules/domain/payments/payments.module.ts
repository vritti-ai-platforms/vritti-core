import { Module } from '@nestjs/common';
import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [InvoicesDomainModule],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsDomainModule {}
