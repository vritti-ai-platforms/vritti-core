import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Switch } from '@vritti/quantum-ui-native/Switch';
import { Text } from '@vritti/quantum-ui-native/Text';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
import { forwardRef, useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateItemLocation, useUpdateItemLocation } from '../../../../hooks/site/item-locations';
import {
  type CreateItemLocationFormValues,
  createItemLocationSchema,
} from '../../../../schemas/item-locations/item-location';
import { LocationSelector } from '../../../../selectors/location';
import type { ItemLocation } from '../../../../types/item-locations';

interface ItemLocationFormSheetProps {
  inventoryItemId: string;
  // The config being edited, or null to create a new one.
  editing: ItemLocation | null;
}

const EMPTY: Partial<CreateItemLocationFormValues> = {
  isBlocked: false,
};

// Create/edit an item-location config in a bottom sheet (opened by the tab's FAB / a card's edit). Create shows
// the location picker; edit keeps the location fixed (only the blocked flag changes). Mirrors UomConversionFormSheet.
export const ItemLocationFormSheet = forwardRef<BottomSheetRef, ItemLocationFormSheetProps>(
  ({ inventoryItemId, editing }, ref) => {
    const isEdit = editing != null;
    const [createLocation, { loading: creating, error: createError, reset: resetCreate }] = useCreateItemLocation();
    const [updateLocation, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateItemLocation();
    const submitError = isEdit ? updateError : createError;

    const form = useForm<CreateItemLocationFormValues>({
      resolver: zodResolver(createItemLocationSchema),
      defaultValues: EMPTY,
    });
    // Switch types `checked` as required; <Form> overrides it with the bound value, so pass the same live value.
    const isBlocked = useWatch({ control: form.control, name: 'isBlocked' });

    // Seed from the current target on every open (onPresent) so reopening restores original values and clears
    // any stale mutation error. On edit the location is fixed (prefilled so the schema passes).
    const seedForm = useCallback(() => {
      form.reset(editing ? { locationId: editing.locationId, isBlocked: editing.isBlocked } : EMPTY);
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
      if (isEdit && editing) {
        const result = await updateLocation({ variables: { id: editing.id, input: { isBlocked: values.isBlocked } } });
        if (!result.error) close();
        return;
      }
      const result = await createLocation({
        variables: { inventoryItemId, input: { locationId: values.locationId, isBlocked: values.isBlocked } },
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
            <Switch
              name="isBlocked"
              checked={isBlocked}
              label="Blocked"
              description="No new putaway of this item into this location"
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
