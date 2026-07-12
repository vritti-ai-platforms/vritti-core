import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [InvoicesDomainModule],
  controllers: [InvoicesController],
})
export class SiteInvoicesModule {}
