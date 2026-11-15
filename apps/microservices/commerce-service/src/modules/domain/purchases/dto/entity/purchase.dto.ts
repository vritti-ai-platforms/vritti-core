import type { Purchase, PurchaseStatus, PurchaseStep } from '@/db/schema';

export const PurchaseActionValues = {
  EDIT: 'EDIT',
  CANCEL: 'CANCEL',
  DELETE: 'DELETE',
  EDIT_ITEMS: 'EDIT_ITEMS',
  SUBMIT_ITEMS: 'SUBMIT_ITEMS',
  REQUEST_QUOTATION: 'REQUEST_QUOTATION',
  COMPLETE_QUOTATIONS: 'COMPLETE_QUOTATIONS',
  EDIT_ALLOCATIONS: 'EDIT_ALLOCATIONS',
  SUBMIT: 'SUBMIT',
} as const;

export type PurchaseAction = (typeof PurchaseActionValues)[keyof typeof PurchaseActionValues];

export const PurchaseStepLabels: Record<PurchaseStep, string> = {
  REQUESTING: 'Requesting',
  QUOTING: 'Quoting',
  SOURCING: 'Sourcing',
  PROCURING: 'Procuring',
};

export const PurchaseStatusLabels: Record<PurchaseStatus, string> = {
  OPEN: 'Open',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export class PurchaseDto {
  id: string;
  purchaseNumber: string;
  step: PurchaseStep;
  status: PurchaseStatus;
  siteId: string;
  legalEntityId: string;
  quotationsRequired: boolean;
  minQuotations: number;
  notes: string | null;
  createdBy: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;

  static from(row: Purchase): PurchaseDto {
    const dto = new PurchaseDto();
    dto.id = row.id;
    dto.purchaseNumber = row.purchaseNumber;
    dto.step = row.step;
    dto.status = row.status;
    dto.siteId = row.siteId;
    dto.legalEntityId = row.legalEntityId;
    dto.quotationsRequired = row.quotationsRequired;
    dto.minQuotations = row.minQuotations;
    dto.notes = row.notes;
    dto.createdBy = row.createdBy;
    dto.submittedAt = row.submittedAt?.toISOString() ?? null;
    dto.completedAt = row.completedAt?.toISOString() ?? null;
    dto.cancelledAt = row.cancelledAt?.toISOString() ?? null;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
