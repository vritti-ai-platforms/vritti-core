import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { UomSelector } from '@vritti/quantum-ui-native/selects/uom';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateUomConversion, useUpdateUomConversion } from '../../../../hooks/site/uom-conversions';
import {
  type CreateUomConversionFormValues,
  createUomConversionSchema,
} from '../../../../schemas/uom-conversions/uom-conversion';
import type { UomConversion } from '../../../../types/uom-conversions';

interface UomConversionFormSheetProps {
  inventoryItemId: string;
  // The item's primary UOM symbol — shown in the field labels for context.
  primaryUomSymbol: string | null;
  // The conversion being edited, or null to create a new one.
  editing: UomConversion | null;
}

const EMPTY: CreateUomConversionFormValues = {
  uomId: '',
  primaryUomQty: Number.NaN,
  uomQty: Number.NaN,
};

// Create/edit a UOM conversion in a bottom sheet (opened by the tab's FAB / a card press). Create shows the
// UOM picker; edit keeps the UOM fixed (only the ratio changes). Reuses the quantum <Form> name-wiring +
// react-hook-form + zod, exactly like InventoryItemForm.
export const UomConversionFormSheet = forwardRef<BottomSheetRef, UomConversionFormSheetProps>(
  ({ inventoryItemId, primaryUomSymbol, editing }, ref) => {
    const isEdit = editing != null;
    const [createConversion, { loading: creating, error: createError, reset: resetCreate }] =
      useCreateUomConversion(inventoryItemId);
    const [updateConversion, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateUomConversion();
    const submitError = isEdit ? updateError : createError;

    // The chosen alt-UOM symbol drives the "Count of <symbol>" qty label (matches web). On edit the unit is
    // fixed, so it comes straight from the conversion being edited; on create it's captured from the picker.
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const altSymbol = isEdit ? (editing?.uomSymbol ?? null) : selectedSymbol;

    const form = useForm<CreateUomConversionFormValues>({
      resolver: zodResolver(createUomConversionSchema),
      defaultValues: EMPTY,
    });

    // Seed the form from the current target: prefill on edit, blank on create. Called on every open (the sheet's
    // onPresent) — not only when `editing` changes — so reopening the SAME conversion after unsaved edits restores
    // its original values. (The editing object reference doesn't change between opens, so the effect alone wouldn't
    // re-run and the form would keep the stale edits.)
    const seedForm = useCallback(() => {
      form.reset(
        editing
          ? {
              uomId: editing.uomId,
              primaryUomQty: editing.primaryUomQty,
              uomQty: editing.uomQty,
            }
          : EMPTY,
      );
      setSelectedSymbol(null);
      // Clear any stale mutation error so a prior failure's StaticAlert doesn't persist into a fresh open.
      resetCreate();
      resetUpdate();
    }, [editing, form, resetCreate, resetUpdate]);

    useEffect(() => {
      seedForm();
    }, [seedForm]);

    const close = () => {
      if (ref && typeof ref !== 'function') ref.current?.dismiss();
    };

    const handleSubmit = async (values: CreateUomConversionFormValues) => {
      const primaryUomQty = values.primaryUomQty;
      const uomQty = values.uomQty;
      if (isEdit && editing) {
        const result = await updateConversion({
          variables: { id: editing.id, input: { primaryUomQty, uomQty } },
        });
        if (!result.error) close();
        return;
      }
      const result = await createConversion({
        variables: {
          inventoryItemId,
          input: { uomId: values.uomId, primaryUomQty, uomQty },
        },
      });
      if (!result.error) close();
    };

    return (
      <BottomSheet
        ref={ref}
        variant="inline"
        title={isEdit ? 'Edit conversion' : 'Add conversion'}
        detents={['70%']}
        onPresent={seedForm}
      >
        <Form form={form}>
          <View className="gap-4 px-4 pb-4">
            {submitError ? (
              <StaticAlert
                variant="destructive"
                title={isEdit ? "Couldn't update conversion" : "Couldn't add conversion"}
                description={submitError.message}
              />
            ) : null}
            {isEdit ? (
              <View className="gap-1">
                <Text className="text-sm text-muted-foreground">Unit</Text>
                <Text className="text-base font-medium text-foreground">
                  {editing?.uomName} ({editing?.uomSymbol})
                </Text>
              </View>
            ) : (
              <UomSelector
                name="uomId"
                label="UOM"
                placeholder="Select unit of measure"
                fieldKeys={{ additionalKeys: 'symbol' }}
                onOptionSelect={(opt) => setSelectedSymbol((opt?.additionals?.symbol as string | undefined) ?? null)}
              />
            )}
            <TextField name="uomQty" label={`Count of ${altSymbol ?? 'alt UOM'}`} integer positive />
            <TextField name="primaryUomQty" label={`Count of ${primaryUomSymbol ?? 'primary'}`} integer positive />
            <Button isLoading={creating || updating} onPress={form.handleSubmit(handleSubmit)}>
              <Text>{isEdit ? 'Save changes' : 'Add conversion'}</Text>
            </Button>
          </View>
        </Form>
      </BottomSheet>
    );
  },
);

UomConversionFormSheet.displayName = 'UomConversionFormSheet';
