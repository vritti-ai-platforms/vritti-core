import { InvoicesRepository } from '@domain/invoices/repositories/invoices.repository';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import { InvoiceStatusValues, type PaymentMethod, type PaymentStatus } from '@/db/schema';
import type { CreatePaymentDto } from '@/modules/payments/dto/request/create-payment.dto';
import { PaymentDto } from '../dto/entity/payment.dto';
import { PaymentsRepository } from '../repositories/payments.repository';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly repository: PaymentsRepository,
    private readonly invoicesRepository: InvoicesRepository,
  ) {}

  // Creates a payment and updates the invoice balance
  async createPayment(data: CreatePaymentDto): Promise<PaymentDto> {
    const invoice = await this.invoicesRepository.findById(data.invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (invoice.status === InvoiceStatusValues.VOID) {
      throw new BadRequestException('Cannot record payment for a voided invoice.');
    }

    if (invoice.status === InvoiceStatusValues.PAID) {
      throw new BadRequestException('Invoice is already fully paid.');
    }

    const currentBalance = Number(invoice.balance);
    if (data.amount > currentBalance) {
      throw new BadRequestException('Payment amount exceeds invoice balance.');
    }

    const entity = await this.repository.create({
      invoiceId: data.invoiceId,
      amount: String(data.amount),
      method: data.method as PaymentMethod,
      reference: data.reference ?? null,
      status: (data.status as PaymentStatus) ?? 'COMPLETED',
      notes: data.notes ?? null,
    });

    const newPaidAmount = Number(invoice.paidAmount) + data.amount;
    const newBalance = Number(invoice.totalAmount) - newPaidAmount;
    const newStatus = newBalance <= 0 ? InvoiceStatusValues.PAID : InvoiceStatusValues.PARTIALLY_PAID;

    await this.invoicesRepository.update(invoice.id, {
      paidAmount: String(newPaidAmount),
      balance: String(newBalance),
      status: newStatus,
    });

    this.logger.log(`Created payment of ${data.amount} for invoice ${invoice.invoiceNumber}`);
    return PaymentDto.from(entity);
  }
}
