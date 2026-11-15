import { Injectable } from '@nestjs/common';
import { type PurchaseLegStep, PurchaseLegStepValues } from '@/db/schema';
import {
  type PurchaseEventAction,
  PurchaseEventActionValues,
  type PurchaseEventDocumentType,
  PurchaseEventDto,
  PurchaseEventKindActions,
} from '../dto/entity/purchase-event.dto';
import type { PurchaseEventsQueryDto } from '../dto/request/purchase-events-query.dto';
import { PurchaseEventsDomainRepository } from '../repositories/purchase-events.repository';

export interface PurchaseEventRecord {
  purchaseId: string;
  action: PurchaseEventAction;
  actorId: string | null;
  purchaseSupplierId?: string | null;
  stepBefore?: string | null;
  stepAfter?: string | null;
  documentType?: PurchaseEventDocumentType | null;
  documentId?: string | null;
  reason?: string | null;
}

export interface PurchaseLegRejection {
  reason: string;
  actorId: string | null;
  at: string;
}

export interface PurchaseLegHistory {
  submittedAt: string | null;
  submittedBy: string | null;
  rejection: PurchaseLegRejection | null;
}

@Injectable()
export class PurchaseEventsDomainService {
  private static readonly SUBMIT_ACTIONS: string[] = [
    PurchaseEventActionValues.SUBMIT,
    PurchaseEventActionValues.SUBMIT_SUPPLIER,
  ];

  constructor(private readonly repository: PurchaseEventsDomainRepository) {}

  // Appends an event to a purchase's history, in the caller's transaction
  async record(event: PurchaseEventRecord): Promise<void> {
    await this.repository.create(event);
  }

  // Returns a purchase's events, newest first
  async findByPurchaseId(purchaseId: string): Promise<PurchaseEventDto[]> {
    const rows = await this.repository.findByPurchaseId(purchaseId);
    return rows.map(PurchaseEventDto.from);
  }

  // Returns one page of a purchase's events, newest first, narrowed to a kind's actions and to one leg when given
  async findPageForPurchase(
    purchaseId: string,
    query: Omit<PurchaseEventsQueryDto, 'id'>,
  ): Promise<{ result: PurchaseEventDto[]; count: number }> {
    const { result, count } = await this.repository.findPageForPurchase(
      purchaseId,
      {
        actions: query.kind ? PurchaseEventKindActions[query.kind] : undefined,
        purchaseSupplierId: query.purchaseSupplierId,
      },
      { limit: query.limit, offset: query.offset },
    );
    return { result: result.map(PurchaseEventDto.from), count };
  }

  // Returns the user who last started a leg, or null when it was never started or no user did
  async findLastSubmitterId(purchaseSupplierId: string): Promise<string | null> {
    const submission = await this.repository.findLastSubmission(purchaseSupplierId);
    return submission?.actorId ?? null;
  }

  // Reads when and by whom a leg was last started, and its last rejection while it is back in sourcing, from the
  // purchase's events (newest first)
  legHistory(events: PurchaseEventDto[], leg: { id: string; step: PurchaseLegStep }): PurchaseLegHistory {
    const legEvents = events.filter((event) => event.purchaseSupplierId === leg.id);
    const submission = legEvents.find((event) => PurchaseEventsDomainService.SUBMIT_ACTIONS.includes(event.action));
    const rejection =
      leg.step === PurchaseLegStepValues.SOURCING
        ? legEvents.find((event) => event.action === PurchaseEventActionValues.REJECT)
        : undefined;
    return {
      submittedAt: submission?.createdAt ?? null,
      submittedBy: submission?.actorId ?? null,
      rejection: rejection
        ? { reason: rejection.reason ?? '', actorId: rejection.actorId, at: rejection.createdAt }
        : null,
    };
  }
}
