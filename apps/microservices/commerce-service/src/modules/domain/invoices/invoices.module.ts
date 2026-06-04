import { Module } from '@nestjs/common';
import { InvoicesRepository } from './repositories/invoices.repository';
import { InvoicesService } from './services/invoices.service';

@Module({
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService, InvoicesRepository],
})
export class InvoicesDomainModule {}
