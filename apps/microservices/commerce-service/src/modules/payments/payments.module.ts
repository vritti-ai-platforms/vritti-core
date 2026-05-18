import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { PaymentsDomainModule } from '@domain/payments/payments.module';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [PaymentsDomainModule, InvoicesDomainModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
