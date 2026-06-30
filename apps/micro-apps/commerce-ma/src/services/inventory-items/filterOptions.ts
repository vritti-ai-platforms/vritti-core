import type { SelectOption } from '@vritti/quantum-ui-native/Select';
import type { FilterCondition, InventoryItemTracking, InventoryItemType } from '../../types/inventory-items';

export const TYPE_OPTIONS: SelectOption[] = [
  { value: 'RAW_MATERIAL', label: 'Raw material' },
  { value: 'SEMI_FINISHED', label: 'Semi-finished' },
  { value: 'FINISHED_GOOD', label: 'Finished good' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'CONSUMABLE', label: 'Consumable' },
];

export const TRACKING_OPTIONS: SelectOption[] = [
  { value: 'quantity', label: 'Quantity' },
  { value: 'lot', label: 'Lot' },
  { value: 'lot_serial', label: 'Lot + serial' },
  { value: 'serial', label: 'Serial' },
];

export const PICK_STRATEGY_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'fifo', label: 'FIFO', description: 'First in, first out' },
  { value: 'fefo', label: 'FEFO', description: 'First expired, first out' },
];

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
const TRACKING_LABELS = Object.fromEntries(TRACKING_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

export function typeLabel(value: InventoryItemType | string): string {
  return TYPE_LABELS[value] ?? value;
}

export function trackingLabel(value: InventoryItemTracking | string): string {
  return TRACKING_LABELS[value] ?? value;
}

// Local UI state for the filter sheet. Each entry is the set of selected enum values for a field.
export interface InventoryFilterState {
  type: string[];
  tracking: string[];
}

export const EMPTY_FILTER_STATE: InventoryFilterState = { type: [], tracking: [] };

// Translate the sheet's selection state into the backend FilterCondition[] contract. Each
// non-empty multi-select becomes an `isAnyOf` condition with a string[] value.
export function toFilterConditions(state: InventoryFilterState): FilterCondition[] {
  const conditions: FilterCondition[] = [];
  if (state.type.length > 0) conditions.push({ field: 'type', operator: 'isAnyOf', value: state.type });
  if (state.tracking.length > 0) conditions.push({ field: 'tracking', operator: 'isAnyOf', value: state.tracking });
  return conditions;
}

export interface ActiveFilterChip {
  field: keyof InventoryFilterState;
  value: string;
  label: string;
}

// Flatten the selection state into removable chip descriptors shown above the list.
export function toActiveChips(state: InventoryFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  for (const value of state.type) chips.push({ field: 'type', value, label: `Type: ${typeLabel(value)}` });
  for (const value of state.tracking) {
    chips.push({ field: 'tracking', value, label: `Tracking: ${trackingLabel(value)}` });
  }
  return chips;
}
