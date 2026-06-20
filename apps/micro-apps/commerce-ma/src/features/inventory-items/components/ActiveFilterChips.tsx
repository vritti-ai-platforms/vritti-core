import { Chip } from '@vritti/quantum-ui-native/Label';
import { View } from 'react-native';
import { type ActiveFilterChip, type InventoryFilterState, toActiveChips } from '../../../services/inventory-items';

interface ActiveFilterChipsProps {
  value: InventoryFilterState;
  onRemove: (chip: ActiveFilterChip) => void;
}

// Removable chips for every active filter selection. Removing a chip drops that single value from
// its field. Renders nothing when there are no active filters.
export function ActiveFilterChips({ value, onRemove }: ActiveFilterChipsProps) {
  const chips = toActiveChips(value);
  if (chips.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {chips.map((chip) => (
        <Chip key={`${chip.field}:${chip.value}`} label={chip.label} onRemove={() => onRemove(chip)} />
      ))}
    </View>
  );
}
