import { defineRelations } from '@vritti/api-sdk/drizzle-orm';
import * as schema from './index';

export const relations = defineRelations(schema, (r) => ({
  paymentIntents: {
    allocations: r.many.paymentAllocations(),
    events: r.many.paymentEvents(),
  },
  paymentEvents: {
    intent: r.one.paymentIntents({
      from: r.paymentEvents.intentId,
      to: r.paymentIntents.id,
    }),
  },
  paymentAllocations: {
    intent: r.one.paymentIntents({
      from: r.paymentAllocations.intentId,
      to: r.paymentIntents.id,
    }),
  },
}));
