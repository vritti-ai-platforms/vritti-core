import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { InvoiceController } from './invoice/controllers/invoice.controller';
import { InvoiceRepository } from './invoice/repositories/invoice.repository';
import { InvoiceService } from './invoice/services/invoice.service';

@Module({
  imports: [OrdersModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceRepository],
})
export class InvoicingModule {}
