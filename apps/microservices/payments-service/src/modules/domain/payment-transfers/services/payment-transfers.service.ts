import { Injectable, Logger } from '@nestjs/common';
import { type PaymentTransferStatus, PaymentTransferStatusValues } from '@/db/schema';
import { PaymentTransferDto } from '../dto/entity/payment-transfer.dto';
import type { ApplyTransferEventInput, ApplyTransferEventResult } from '../dto/request/apply-transfer-event.dto';
import type { CreatePaymentTransferInput } from '../dto/request/create-payment-transfer.dto';
import { PaymentTransfersDomainRepository } from '../repositories/payment-transfers.repository';

// The statuses a transfer may move to each status from. A transfer only moves forward —
// CREATED < PENDING < PROCESSED < PARTIALLY_REVERSED < REVERSED — and FAILED ends one not yet processed, so an event
// delivered out of order can never undo a later one
const FORWARD_FROM: Readonly<Record<PaymentTransferStatus, PaymentTransferStatus[]>> = {
  CREATED: [],
  PENDING: ['CREATED'],
  PROCESSED: ['CREATED', 'PENDING'],
  PARTIALLY_REVERSED: ['CREATED', 'PENDING', 'PROCESSED'],
  REVERSED: ['CREATED', 'PENDING', 'PROCESSED', 'PARTIALLY_REVERSED'],
  FAILED: ['CREATED', 'PENDING'],
};

@Injectable()
export class PaymentTransfersDomainService {
  private readonly logger = new Logger(PaymentTransfersDomainService.name);

  constructor(private readonly repository: PaymentTransfersDomainRepository) {}

  // Records the split legs of an intent before they are sent to the gateway
  async createForIntent(rows: CreatePaymentTransferInput[]): Promise<PaymentTransferDto[]> {
    if (rows.length === 0) return [];
    const created = await this.repository.createMany(
      rows.map((row) => ({
        intentId: row.intentId,
        linkedAccountId: row.linkedAccountId,
        providerAccountId: row.providerAccountId,
        amount: row.amount,
        currency: row.currency,
        onHold: row.onHold ?? false,
        onHoldUntil: row.onHoldUntil ?? null,
        status: PaymentTransferStatusValues.CREATED,
      })),
    );
    this.logger.log(`Recorded ${created.length} transfer(s) for intent ${rows[0].intentId}`);
    return created.map((entity) => PaymentTransferDto.from(entity));
  }

  // Stamps the gateway's transfer id and initial status once the gateway accepted the leg
  async markCreated(
    id: string,
    providerTransferId: string,
    status: PaymentTransferStatus,
  ): Promise<PaymentTransferDto> {
    const entity = await this.repository.update(id, {
      providerTransferId,
      status,
      errorCode: null,
      errorDescription: null,
    });
    this.logger.log(`Transfer ${id} created at gateway as ${providerTransferId} (${status})`);
    return PaymentTransferDto.from(entity);
  }

  // Applies a gateway transfer event to the row it names, if it moves that row forward
  async applyTransferEvent(transfer: ApplyTransferEventInput): Promise<ApplyTransferEventResult> {
    const entity = await this.repository.updateByProviderTransferIdFrom(
      transfer.providerTransferId,
      FORWARD_FROM[transfer.status],
      {
        status: transfer.status,
        errorCode: transfer.errorCode ?? null,
        errorDescription: transfer.errorDescription ?? null,
      },
    );
    if (entity) {
      this.logger.log(`Transfer ${entity.id} (${transfer.providerTransferId}) is now ${transfer.status}`);
      return { outcome: 'applied', transfer: PaymentTransferDto.from(entity) };
    }

    const existing = await this.repository.findByProviderTransferId(transfer.providerTransferId);
    if (existing) {
      this.logger.log(
        `Transfer ${existing.id} is already ${existing.status} — ${transfer.status} for ${transfer.providerTransferId} would move it back, skipped`,
      );
      return { outcome: 'stale', transfer: PaymentTransferDto.from(existing) };
    }

    if (transfer.providerPaymentId && transfer.providerAccountId) {
      const pending = await this.repository.findUnstampedByPaymentAndAccount(
        transfer.providerPaymentId,
        transfer.providerAccountId,
      );
      if (pending) {
        this.logger.warn(
          `Gateway transfer ${transfer.providerTransferId} arrived before transfer ${pending.id} was stamped — retry later`,
        );
        return { outcome: 'in_flight' };
      }
    }

    this.logger.warn(`No transfer recorded for gateway transfer ${transfer.providerTransferId} — event ignored`);
    return { outcome: 'unknown' };
  }
}
