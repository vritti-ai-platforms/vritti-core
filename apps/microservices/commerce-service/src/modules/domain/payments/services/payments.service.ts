import { Injectable, Logger } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { InvoiceStatusValues, type PaymentMethod, type PaymentStatus } from '@/db/schema';
import { PaymentDto } from '../dto/entity/payment.dto';
import type { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { PaymentsDomainRepository } from '../repositories/payments.repository';

// Invoice context pre-fetched by the app-layer before payment creation
export type PaymentInvoiceContext = {
  id: string;
  invoiceNumber: string;
  status: string;
  balance: bigint;
  totalAmount: bigint;
  paidAmount: bigint;
};

@Injectable()
export class PaymentsDomainService {
  private readonly logger = new Logger(PaymentsDomainService.name);

  constructor(private readonly repository: PaymentsDomainRepository) {}

  // Creates a payment record. App-layer fetches the invoice and updates it after payment creation.
  // Returns the payment DTO and invoice balance deltas for the app-layer to apply.
  async createPayment(
    data: CreatePaymentDto,
    invoice: PaymentInvoiceContext,
  ): Promise<{ payment: PaymentDto; newPaidAmount: bigint; newBalance: bigint; newStatus: string }> {
    if (invoice.status === InvoiceStatusValues.VOID) {
      throw new BadRequestException('Cannot record payment for a voided invoice.');
    }

    if (invoice.status === InvoiceStatusValues.PAID) {
      throw new BadRequestException('Invoice is already fully paid.');
    }

    const requestedAmount = new Decimal(data.amount);
    const balance = new Decimal(invoice.balance.toString());
    if (requestedAmount.greaterThan(balance)) {
      throw new BadRequestException('Payment amount exceeds invoice balance.');
    }

    const amountMinor = toMinorBigInt(requestedAmount);

    const entity = await this.repository.create({
      invoiceId: data.invoiceId,
      amount: amountMinor,
      method: data.method as PaymentMethod,
      reference: data.reference ?? null,
      status: (data.status as PaymentStatus) ?? 'COMPLETED',
      notes: data.notes ?? null,
    });

    const newPaidAmount = invoice.paidAmount + amountMinor;
    const newBalance = invoice.totalAmount - newPaidAmount;
    const newStatus = newBalance <= 0n ? InvoiceStatusValues.PAID : InvoiceStatusValues.PARTIALLY_PAID;

    this.logger.log(`Created payment of ${data.amount} for invoice ${invoice.invoiceNumber}`);
    return { payment: PaymentDto.from(entity), newPaidAmount, newBalance, newStatus };
  }
}

function toMinorBigInt(value: Decimal): bigint {
  return BigInt(value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
}
