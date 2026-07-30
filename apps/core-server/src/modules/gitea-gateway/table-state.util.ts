import type { TableViewState } from '@vritti/api-sdk/database';

// Gitea caps any page at 50; the DataTable's largest page size is also 50, so this only guards a
// hand-crafted state
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

// Translates the DataTable's row offset into the one-based page number Gitea expects
export function toGiteaPaging(state: TableViewState): { page: number; limit: number } {
  const requested = state.pagination?.limit ?? DEFAULT_PAGE_SIZE;
  // A zero limit would divide by zero below and ask Gitea for an empty page
  const limit = Math.min(requested > 0 ? requested : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = state.pagination?.offset ?? 0;

  return { limit, page: Math.floor(offset / limit) + 1 };
}

// Picks out the equality filters Gitea can actually honour, keyed by field name.
//
// The git service has no query language: each endpoint accepts a fixed set of single-value params. So
// only `equals` on an allowed field is applied — every other field, every other operator, the search
// term, and sorting entirely are round-tripped to the client untouched rather than silently faked. A
// table column that appears sortable but is not would be worse than one that never claims to be, which
// is why the callers pass `enableSorting: false`.
export function toGiteaFilters(state: TableViewState, allowedFields: readonly string[]): Record<string, string> {
  const params: Record<string, string> = {};

  for (const condition of state.filters ?? []) {
    if (condition.operator !== 'equals') continue;
    if (!allowedFields.includes(condition.field)) continue;
    if (Array.isArray(condition.value)) continue;

    const value = String(condition.value).trim();
    if (value) params[condition.field] = value;
  }

  return params;
}
