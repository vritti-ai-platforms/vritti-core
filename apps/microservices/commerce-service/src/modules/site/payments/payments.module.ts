import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { PaymentsDomainModule } from '@domain/payments/payments.module';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [PaymentsDomainModule, InvoicesDomainModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class SitePaymentsModule {}
