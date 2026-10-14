import type { PaymentEventResponseDto } from '../intents/dto/response/payment-event-response.dto';

export interface PaymentEventHandler {
  readonly referenceType: string;
  handle(orgId: string, event: PaymentEventResponseDto): Promise<void>;
}
