import { InvoicesDomainRepository } from '@domain/invoices/repositories/invoices.repository';
import type { PaymentDto } from '@domain/payments/dto/entity/payment.dto';
import type { CreatePaymentDto } from '@domain/payments/dto/request/create-payment.dto';
import { PaymentsDomainService } from '@domain/payments/services/payments.service';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { InvoiceStatusValues } from '@/db/schema';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly service: PaymentsDomainService,
    private readonly invoicesRepository: InvoicesDomainRepository,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentDto> {
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
