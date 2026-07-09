import { InvoicesRepository } from '@domain/invoices/repositories/invoices.repository';
import type { PaymentDto } from '@domain/payments/dto/entity/payment.dto';
import { PaymentsService } from '@domain/payments/services/payments.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { InvoiceStatusValues } from '@/db/schema';
import type { CreatePaymentDto } from './dto/request/create-payment.dto';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly service: PaymentsService,
    private readonly invoicesRepository: InvoicesRepository,
  ) {}

  @MessagePattern({ cmd: 'payments.create' })
  async create(@Payload() dto: CreatePaymentDto): Promise<PaymentDto> {
    this.logger.log(`payments.create — invoiceId: ${dto.invoiceId}`);
    const invoice = await this.invoicesRepository.findById(dto.invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    const invoiceContext = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      balance: invoice.balance,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
    };
    const result = await this.service.createPayment(dto, invoiceContext);
    await this.invoicesRepository.update(invoice.id, {
      paidAmount: result.newPaidAmount,
      balance: result.newBalance,
      status: result.newStatus as (typeof InvoiceStatusValues)[keyof typeof InvoiceStatusValues],
    });
    return result.payment;
  }
}
