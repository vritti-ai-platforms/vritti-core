import { type WebhookDeliveryStatus, WebhookDeliveryStatusValues } from '@/db/schema';

const MINUTE = 60 * 1000;

// Wait before the next try, indexed by the number of attempts already made (1-based)
export const WEBHOOK_RETRY_DELAYS_MS = [1 * MINUTE, 5 * MINUTE, 30 * MINUTE, 120 * MINUTE, 720 * MINUTE] as const;

export const WEBHOOK_MAX_ATTEMPTS = WEBHOOK_RETRY_DELAYS_MS.length + 1;

export interface WebhookRetryDecision {
  status: WebhookDeliveryStatus;
  nextAttemptAt: Date;
}

// Decides what follows a failed attempt: the next slot in the schedule, or FAILED once the attempts run out
export function scheduleAfterFailedAttempt(attempts: number, now: Date): WebhookRetryDecision {
  if (attempts >= WEBHOOK_MAX_ATTEMPTS) {
    return { status: WebhookDeliveryStatusValues.FAILED, nextAttemptAt: now };
  }
  const delay = WEBHOOK_RETRY_DELAYS_MS[Math.max(attempts, 1) - 1];
  return { status: WebhookDeliveryStatusValues.PENDING, nextAttemptAt: new Date(now.getTime() + delay) };
}
