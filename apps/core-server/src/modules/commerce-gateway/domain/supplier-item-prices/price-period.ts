import type { FilterCondition } from '@vritti/api-sdk/conditions';

// Returns a price chart's context with the default window — two months back to one month ahead — when it has no period
export function withDefaultPeriod(context: FilterCondition[]): FilterCondition[] {
  if (context.some((condition) => condition.field === 'period')) return context;
  const today = new Date();
  const shift = (months: number) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, today.getUTCDate()))
      .toISOString()
      .slice(0, 10);
  return [...context, { field: 'period', operator: 'between', value: [shift(-2), shift(1)] }];
}
