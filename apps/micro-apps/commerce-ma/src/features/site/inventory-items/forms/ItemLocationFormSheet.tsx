import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { LocationSelector } from '@vritti/quantum-ui-native/selects/location';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
import { forwardRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateItemLocation, useUpdateItemLocation } from '../../../../hooks/site/item-locations';
import {
  type CreateItemLocationFormValues,
  createItemLocationSchema,
} from '../../../../schemas/item-locations/item-location';
import type { ItemLocation } from '../../../../types/item-locations';

interface ItemLocationFormSheetProps {
  inventoryItemId: string;
  // The item's primary UOM symbol — shown in the Min. Stock Level field label.
  uomSymbol: string | null;
  // The config being edited, or null to create a new one.
  editing: ItemLocation | null;
}

const EMPTY: CreateItemLocationFormValues = {
  locationId: '',
  reorderLevel: '',
};

// Create/edit an item-location config in a bottom sheet (opened by the tab's FAB / a card's edit). Create shows
// the location picker; edit keeps the location fixed (only the reorder level changes). Mirrors UomConversionFormSheet.
export const ItemLocationFormSheet = forwardRef<BottomSheetRef, ItemLocationFormSheetProps>(
  ({ inventoryItemId, uomSymbol, editing }, ref) => {
    const isEdit = editing != null;
    const [createLocation, { loading: creating, error: createError, reset: resetCreate }] = useCreateItemLocation();
    const [updateLocation, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateItemLocation();
    const submitError = isEdit ? updateError : createError;

    const form = useForm<CreateItemLocationFormValues>({
      resolver: zodResolver(createItemLocationSchema),
      defaultValues: EMPTY,
    });

    // Seed from the current target on every open (onPresent) so reopening restores original values and clears
    // any stale mutation error. On edit the location is fixed (prefilled so the schema passes).
    const seedForm = useCallback(() => {
      form.reset(editing ? { locationId: editing.locationId, reorderLevel: String(editing.reorderLevel) } : EMPTY);
      resetCreate();
      resetUpdate();
    }, [editing, form, resetCreate, resetUpdate]);

    useEffect(() => {
      seedForm();
    }, [seedForm]);

    const close = () => {
      if (ref && typeof ref !== 'function') ref.current?.dismiss();
    };

    const handleSubmit = async (values: CreateItemLocationFormValues) => {
      const reorderLevel = Number(values.reorderLevel);
      if (isEdit && editing) {
        const result = await updateLocation({ variables: { id: editing.id, input: { reorderLevel } } });
        if (!result.error) close();
        return;
      }
      const result = await createLocation({
        variables: { inventoryItemId, input: { locationId: values.locationId, reorderLevel } },
      });
      if (!result.error) close();
    };

    return (
      <BottomSheet
        ref={ref}
        variant="inline"
        title={isEdit ? 'Edit location' : 'Add location'}
        detents={['70%']}
        onPresent={seedForm}
      >
        <Form form={form}>
          <View className="gap-4 px-4 pb-4">
            {submitError ? (
              <StaticAlert
                variant="destructive"
                title={isEdit ? "Couldn't update location" : "Couldn't add location"}
                description={submitError.message}
              />
            ) : null}
            {isEdit ? (
              <View className="gap-1">
                <Text className="text-sm text-muted-foreground">Location</Text>
                <Text className="text-base font-medium text-foreground">
                  {editing?.locationName ?? editing?.locationPath ?? '—'}
                </Text>
              </View>
            ) : (
              <LocationSelector
                name="locationId"
                label="Location"
                placeholder="Select location"
                params={{ locationRoles: 'RESERVED_STORAGE' }}
              />
            )}
            <TextField
              name="reorderLevel"
              label={`Min. Stock Level (${uomSymbol ?? 'units'})`}
              keyboardType="decimal-pad"
            />
            <Button isLoading={creating || updating} onPress={form.handleSubmit(handleSubmit)}>
              <Text>{isEdit ? 'Save changes' : 'Add location'}</Text>
            </Button>
          </View>
        </Form>
      </BottomSheet>
    );
  },
);

ItemLocationFormSheet.displayName = 'ItemLocationFormSheet';
