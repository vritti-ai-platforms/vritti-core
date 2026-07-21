import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
import { forwardRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateUomDimension, useUpdateUomDimension } from '../../../../hooks/organization/uom-dimensions';
import { type UomDimensionFormValues, uomDimensionSchema } from '../../../../schemas/uom-dimensions/uom-dimension';
import type { UomDimension } from '../../../../types/uom-dimensions';

interface UomDimensionFormSheetProps {
  // The dimension being edited, or null to create a new one.
  editing: UomDimension | null;
}

const EMPTY: UomDimensionFormValues = { code: '', name: '', description: '' };

// Create/edit a UOM dimension in a bottom sheet (opened by the list's FAB / a card's edit action). Reuses
// the quantum <Form> name-wiring + react-hook-form + zod, exactly like UomConversionFormSheet.
export const UomDimensionFormSheet = forwardRef<BottomSheetRef, UomDimensionFormSheetProps>(({ editing }, ref) => {
  const isEdit = editing != null;
  const [createDimension, { loading: creating, error: createError, reset: resetCreate }] = useCreateUomDimension();
  const [updateDimension, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateUomDimension();
  const submitError = isEdit ? updateError : createError;

  const form = useForm<UomDimensionFormValues>({
    resolver: zodResolver(uomDimensionSchema),
    defaultValues: EMPTY,
  });

  // Seed on every open (onPresent) — not only when `editing` changes — so reopening the SAME dimension after
  // unsaved edits restores its original values and clears any stale mutation error.
  const seedForm = useCallback(() => {
    form.reset(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            description: editing.description ?? '',
          }
        : EMPTY,
    );
    resetCreate();
    resetUpdate();
  }, [editing, form, resetCreate, resetUpdate]);

  useEffect(() => {
    seedForm();
  }, [seedForm]);

  const close = () => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  };

  const handleSubmit = async (values: UomDimensionFormValues) => {
    const input = {
      code: values.code,
      name: values.name,
      description: values.description,
    };
    if (isEdit && editing) {
      const result = await updateDimension({
        variables: { id: editing.id, input },
      });
      if (!result.error) close();
      return;
    }
    const result = await createDimension({ variables: { input } });
    if (!result.error) close();
  };

  return (
    <BottomSheet
      ref={ref}
      variant="inline"
      title={isEdit ? 'Edit dimension' : 'Add dimension'}
      detents={['auto']}
      onPresent={seedForm}
    >
      <Form form={form}>
        <View className="gap-4 px-2 pb-2">
          {submitError ? (
            <StaticAlert
              variant="destructive"
              title={isEdit ? "Couldn't update dimension" : "Couldn't add dimension"}
              description={submitError.message}
            />
          ) : null}
          <TextField name="code" label="Code" placeholder="e.g. MASS" autoCapitalize="characters" autoCorrect={false} />
          <TextField name="name" label="Name" placeholder="e.g. Mass" autoCapitalize="words" />
          <TextField name="description" label="Description" placeholder="Optional" multiline />
          <Button isLoading={creating || updating} onPress={form.handleSubmit(handleSubmit)}>
            <Text>{isEdit ? 'Save changes' : 'Add dimension'}</Text>
          </Button>
        </View>
      </Form>
    </BottomSheet>
  );
});

UomDimensionFormSheet.displayName = 'UomDimensionFormSheet';
