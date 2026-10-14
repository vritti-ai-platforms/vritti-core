import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';

export class WebhookIngestResultDto {
  accepted: true;
  duplicate: boolean;
  eventIds: string[];
  // Intent events this delivery caused, so core can dispatch them at once instead of waiting for its sweep
  paymentEvents: PaymentEventDto[];
}
