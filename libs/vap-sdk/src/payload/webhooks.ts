import type { Payload } from 'payload' with { 'resolution-mode': 'import' };
import { VapWebhookError, type VapWebhookEvent, verifyVapWebhook } from '../server/webhooks';

/** Under Payload's API route — so `/api/vap/webhooks` with the default `routes.api`. */
export const VAP_WEBHOOK_PATH = '/vap/webhooks';

/**
 * What a site does with a verified payment event — mark the booking paid, release the stock.
 *
 * Throwing answers 500, and core redelivers; so make it idempotent on `event.id` (or on the record's
 * own state), because a delivery that half-succeeded before throwing will arrive again.
 */
export type PaymentEventHandler = (event: VapWebhookEvent, context: { payload: Payload }) => Promise<void> | void;

/** The slice of Payload's request this endpoint reads. Structural for the reason in `runtime.ts`. */
interface WebhookRequest {
  payload: Payload;
  headers: Headers;
  text?: () => Promise<string>;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/**
 * The receiving end of core's payment webhooks, as a Payload root endpoint.
 *
 * Reads the body as text — never Payload's parsed `data` — because the signature covers the exact
 * bytes sent. Answers:
 * - 200 `{ received: true }` once the handler resolves (or for an authentic event type this version
 *   does not know, so core stops retrying it);
 * - 401 when the delivery does not verify;
 * - 500 when the handler throws or the plugin has no `clientSecret`, so core retries.
 */
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
