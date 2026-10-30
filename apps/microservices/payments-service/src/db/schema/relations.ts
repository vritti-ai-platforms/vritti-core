import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
  paymentIntents: {
    attempts: r.many.paymentAttempts(),
    transfers: r.many.paymentTransfers(),
    allocations: r.many.paymentAllocations(),
    events: r.many.paymentEvents(),
  },
  paymentEvents: {
    intent: r.one.paymentIntents({
      from: r.paymentEvents.intentId,
      to: r.paymentIntents.id,
    }),
  },
  paymentAttempts: {
    intent: r.one.paymentIntents({
      from: r.paymentAttempts.intentId,
      to: r.paymentIntents.id,
    }),
  },
  paymentTransfers: {
    intent: r.one.paymentIntents({
      from: r.paymentTransfers.intentId,
      to: r.paymentIntents.id,
    }),
  },
  paymentAllocations: {
    intent: r.one.paymentIntents({
      from: r.paymentAllocations.intentId,
      to: r.paymentIntents.id,
    }),
    transfer: r.one.paymentTransfers({
      from: r.paymentAllocations.transferId,
      to: r.paymentTransfers.id,
    }),
  },
}));
