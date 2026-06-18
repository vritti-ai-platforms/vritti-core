import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Select, type SelectValue } from '@vritti/quantum-ui-native/Select';
import { Text } from '@vritti/quantum-ui-native/Text';
import { forwardRef, useEffect, useState } from 'react';
import { View } from 'react-native';
import { type InventoryFilterState, TRACKING_OPTIONS, TYPE_OPTIONS } from '../filterOptions';

// Select's `multiple` onChange is typed as a single-or-array union; in multiple mode it always
// emits SelectValue[]. Normalize to string[] (our enum values are all strings).
const toStrings = (values: SelectValue | SelectValue[]): string[] =>
  (Array.isArray(values) ? values : []).map((value) => String(value));

interface InventoryFilterSheetProps {
  value: InventoryFilterState;
  onApply: (next: InventoryFilterState) => void;
}

// Bottom sheet holding the multi-select filters. Edits a local draft seeded from the committed
// value each time it opens; "Apply" lifts the draft up, "Clear" empties it. The sheet handle is
// exposed via ref so the screen's Filters button can present it.
export const InventoryFilterSheet = forwardRef<BottomSheetRef, InventoryFilterSheetProps>(
  ({ value, onApply }, ref) => {
    const [draft, setDraft] = useState<InventoryFilterState>(value);

    useEffect(() => {
      setDraft(value);
    }, [value]);

    const handleApply = (next: InventoryFilterState) => {
      onApply(next);
      if (ref && typeof ref !== 'function') ref.current?.dismiss();
    };

    return (
      <BottomSheet ref={ref} variant="inline" title="Filters" detents={['60%']} scrollable>
        <View className="gap-4 px-4 pb-4">
          <Select
            multiple
            label="Type"
            placeholder="Any type"
            clearable
            options={TYPE_OPTIONS}
            value={draft.type}
            onChange={(values: SelectValue | SelectValue[]) =>
              setDraft((prev) => ({ ...prev, type: toStrings(values) }))
            }
          />
          <Select
            multiple
            label="Tracking"
            placeholder="Any tracking"
            clearable
            options={TRACKING_OPTIONS}
            value={draft.tracking}
            onChange={(values: SelectValue | SelectValue[]) =>
              setDraft((prev) => ({ ...prev, tracking: toStrings(values) }))
            }
          />
          <View className="flex-row gap-3 pt-2">
            <Button variant="outline" className="flex-1" onPress={() => setDraft({ type: [], tracking: [] })}>
              <Text>Clear</Text>
            </Button>
            <Button className="flex-1" onPress={() => handleApply(draft)}>
              <Text>Apply</Text>
            </Button>
          </View>
        </View>
      </BottomSheet>
    );
  },
);

InventoryFilterSheet.displayName = 'InventoryFilterSheet';
