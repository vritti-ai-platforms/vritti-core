import type { PaymentEventDto } from '@domain/payment-events/dto/entity/payment-event.dto';
import type { PaymentIntentDto } from '@domain/payment-intents/dto/entity/payment-intent.dto';

// An intent after a change, with the events that change wrote — handed straight back to core so it need not wait
// for its sweep
export interface IntentWithEvents {
  intent: PaymentIntentDto;
  events: PaymentEventDto[];
}
