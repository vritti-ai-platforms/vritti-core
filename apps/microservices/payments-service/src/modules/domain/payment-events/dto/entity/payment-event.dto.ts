import type { PaymentEvent } from '@/db/schema';

// One thing that happened to an intent, as core receives it to dispatch
export class PaymentEventDto {
  id: string;
  intentId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;

  static from(entity: PaymentEvent): PaymentEventDto {
    const dto = new PaymentEventDto();
    dto.id = entity.id;
    dto.intentId = entity.intentId;
    dto.type = entity.type;
    dto.payload = entity.payload;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
