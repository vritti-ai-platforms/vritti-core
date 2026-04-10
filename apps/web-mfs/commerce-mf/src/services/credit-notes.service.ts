import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CreditNoteData, CreditNoteDetail } from '@/schemas/credit-notes';

export interface CreateCreditNotePayload {
  type: string;
  partyType: string;
  partyName: string;
  creditNoteNumber: string;
  amount: number;
  reason: string;
}

export interface ApplyCreditNotePayload {
  invoiceId: string;
  amount: number;
}

// Creates a new credit note
export function createCreditNote(data: CreateCreditNotePayload): Promise<CreditNoteData> {
  return axios
    .post<CreditNoteData>('commerce-api/credit-notes', data)
    .then((r) => r.data);
}

// Fetches credit note detail with applications
export function getCreditNote(id: string): Promise<CreditNoteDetail> {
  return axios
    .get<CreditNoteDetail>(`commerce-api/credit-notes/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches credit notes for the data table
export function getCreditNotesTable(): Promise<CreditNoteData[]> {
  return axios
    .get<CreditNoteData[]>('commerce-api/credit-notes', { showSuccessToast: false })
    .then((r) => r.data);
}

// Applies a credit note to an invoice
export function applyCreditNote({ id, data }: { id: string; data: ApplyCreditNotePayload }): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`commerce-api/credit-notes/${id}/apply`, data)
    .then((r) => r.data);
}
