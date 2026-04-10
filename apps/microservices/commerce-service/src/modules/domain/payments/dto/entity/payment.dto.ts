import type { Payment } from '@/db/schema';

export class PaymentDto {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;

  static from(entity: Payment): PaymentDto {
    const dto = new PaymentDto();
    dto.id = entity.id;
    dto.invoiceId = entity.invoiceId;
    dto.amount = Number(entity.amount);
    dto.method = entity.method;
    dto.reference = entity.reference ?? null;
    dto.status = entity.status;
    dto.paidAt = entity.paidAt.toISOString();
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
