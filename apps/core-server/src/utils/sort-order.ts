// Maps an ordered list of ids to dense sort orders (1, 2, 3, …) for stable drag-reorder sequencing
export function sequentialSortOrders(ids: string[]): { id: string; sortOrder: number }[] {
  return ids.map((id, index) => ({ id, sortOrder: index + 1 }));
}
