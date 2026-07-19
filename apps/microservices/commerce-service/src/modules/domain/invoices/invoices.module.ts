import { Module } from '@nestjs/common';
import { InvoicesDomainRepository } from './repositories/invoices.repository';
import { InvoicesDomainService } from './services/invoices.service';

@Module({
  providers: [InvoicesDomainService, InvoicesDomainRepository],
  exports: [InvoicesDomainService, InvoicesDomainRepository],
})
export class InvoicesDomainModule {}
