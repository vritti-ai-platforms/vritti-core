import type { Purchase, PurchaseStatus } from '@/db/schema';

export const PurchaseActionValues = {
  EDIT: 'EDIT',
  CANCEL: 'CANCEL',
  DELETE: 'DELETE',
  EDIT_ITEMS: 'EDIT_ITEMS',
  REQUEST_QUOTATION: 'REQUEST_QUOTATION',
  EDIT_ALLOCATIONS: 'EDIT_ALLOCATIONS',
  SUBMIT: 'SUBMIT',
  CLOSE: 'CLOSE',
} as const;

export type PurchaseAction = (typeof PurchaseActionValues)[keyof typeof PurchaseActionValues];

export const PurchaseStatusLabels: Record<PurchaseStatus, string> = {
  OPEN: 'Open',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export class PurchaseDto {
  id: string;
  purchaseNumber: string;
  status: PurchaseStatus;
  siteId: string;
  legalEntityId: string;
  quotationsRequired: boolean;
  minQuotations: number;
  notes: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;

  static from(row: Purchase): PurchaseDto {
    const dto = new PurchaseDto();
    dto.id = row.id;
    dto.purchaseNumber = row.purchaseNumber;
    dto.status = row.status;
    dto.siteId = row.siteId;
    dto.legalEntityId = row.legalEntityId;
    dto.quotationsRequired = row.quotationsRequired;
    dto.minQuotations = row.minQuotations;
    dto.notes = row.notes;
    dto.submittedAt = row.submittedAt?.toISOString() ?? null;
    dto.completedAt = row.completedAt?.toISOString() ?? null;
    dto.cancelledAt = row.cancelledAt?.toISOString() ?? null;
    dto.cancelReason = row.cancelReason;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
