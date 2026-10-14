import type { WebhookEventStatus } from '@/db/schema';

export interface WebhookEventInput {
  dedupeKey: string;
  providerEventId: string;
  eventType: string;
  payload: unknown;
}

export interface RecordWebhookEventsInput {
  organizationId: string;
  configId: string;
  gatewayCode: string;
  rawBody: string;
  events: WebhookEventInput[];
}

// One stored delivery: the row it lives in, whether this call stored it or found it already there, and the
// stored row's status — a repeat of one never acted on, or whose handling failed, is still worth acting on
export interface RecordedWebhookEvent {
  id: string;
  inserted: boolean;
  status: WebhookEventStatus;
}
