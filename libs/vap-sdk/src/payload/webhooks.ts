import type { Payload } from 'payload' with { 'resolution-mode': 'import' };
import { VapWebhookError, type VapWebhookEvent, verifyVapWebhook } from '../server/webhooks.js';

export const VAP_WEBHOOK_PATH = '/vap/webhooks';

export type PaymentEventHandler = (event: VapWebhookEvent, context: { payload: Payload }) => Promise<void> | void;

interface WebhookRequest {
  payload: Payload;
  headers: Headers;
  text?: () => Promise<string>;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// The receiving end of core's payment webhooks, as a Payload root endpoint.
export function paymentWebhookEndpoint(options: { clientSecret?: string; onPaymentEvent: PaymentEventHandler }) {
  return {
    path: VAP_WEBHOOK_PATH,
    method: 'post' as const,
    handler: async (req: WebhookRequest): Promise<Response> => {
      const logger = req.payload.logger;

      if (!options.clientSecret) {
        logger.error('VAP webhook received, but vap() has no clientSecret to verify it with');
        return json(500, { error: 'Not configured' });
      }
      if (typeof req.text !== 'function') {
        logger.error('VAP webhook: this Payload request exposes no raw body');
        return json(500, { error: 'No body' });
      }

      let event: VapWebhookEvent;
      try {
        event = verifyVapWebhook({
          rawBody: await req.text(),
          headers: req.headers,
          clientSecret: options.clientSecret,
        });
      } catch (error) {
        if (error instanceof VapWebhookError && error.reason === 'unsupported_event') {
          logger.warn({ err: error }, 'VAP webhook: ignoring an event type this SDK does not know');
          return json(200, { received: true, ignored: true });
        }
        if (error instanceof VapWebhookError && error.reason === 'no_key') {
          logger.error({ err: error }, 'VAP webhook: the configured clientSecret is not a valid key');
          return json(500, { error: 'Not configured' });
        }
        logger.warn({ err: error }, 'VAP webhook refused');
        return json(401, { error: 'Invalid signature' });
      }

      try {
        await options.onPaymentEvent(event, { payload: req.payload });
      } catch (error) {
        logger.error({ err: error, eventId: event.id, type: event.type }, 'VAP webhook handler failed');
        return json(500, { error: 'Handler failed' });
      }
      return json(200, { received: true });
    },
  };
}
