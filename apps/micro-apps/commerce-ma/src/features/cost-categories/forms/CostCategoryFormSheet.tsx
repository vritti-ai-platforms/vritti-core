import { zodResolver } from '@hookform/resolvers/zod';
import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { RadioGroup } from '@vritti/quantum-ui-native/RadioGroup';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { forwardRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateCostCategory, useUpdateCostCategory } from '../../../hooks/cost-categories';
import {
  COST_CATEGORY_KIND_OPTIONS,
  type CostCategoryFormValues,
  costCategorySchema,
} from '../../../schemas/cost-categories/cost-category';
import type { CostCategory } from '../../../types/cost-categories';

interface CostCategoryFormSheetProps {
  // The category being edited, or null to create a new one.
  editing: CostCategory | null;
}

const EMPTY: CostCategoryFormValues = { code: '', name: '', kind: 'OTHER' };

// Create/edit a cost category in a bottom sheet. `code` + `kind` are set on create (kind via a name-wired
// RadioGroup) and are IMMUTABLE on edit (shown read-only) — edit renames only. A duplicate code or a 2nd
// ITEM-kind surfaces as a server 409 in the StaticAlert.
export const CostCategoryFormSheet = forwardRef<BottomSheetRef, CostCategoryFormSheetProps>(({ editing }, ref) => {
  const isEdit = editing != null;
  const [createCategory, { loading: creating, error: createError, reset: resetCreate }] = useCreateCostCategory();
  const [updateCategory, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateCostCategory();
  const submitError = isEdit ? updateError : createError;

  const form = useForm<CostCategoryFormValues>({ resolver: zodResolver(costCategorySchema), defaultValues: EMPTY });

  const seedForm = useCallback(() => {
    form.reset(editing ? { code: editing.code, name: editing.name, kind: editing.kind } : EMPTY);
    resetCreate();
    resetUpdate();
  }, [editing, form, resetCreate, resetUpdate]);

  useEffect(() => {
    seedForm();
  }, [seedForm]);

  const close = () => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  };

  const handleSubmit = async (values: CostCategoryFormValues) => {
    if (isEdit && editing) {
      // Rename only — code + kind are immutable server-side.
      const result = await updateCategory({ variables: { id: editing.id, input: { name: values.name.trim() } } });
      if (!result.error) close();
      return;
    }
    const result = await createCategory({
      variables: { input: { code: values.code.trim(), name: values.name.trim(), kind: values.kind } },
    });
    if (!result.error) close();
  };

  const kindLabel = COST_CATEGORY_KIND_OPTIONS.find((o) => o.value === editing?.kind)?.label ?? editing?.kind;

  return (
    <BottomSheet
      ref={ref}
      variant="inline"
      title={isEdit ? 'Edit cost category' : 'Add cost category'}
      detents={['auto']}
      onPresent={seedForm}
    >
      <Form form={form}>
        <View className="gap-4 px-2 pb-2">
          {submitError ? (
            <StaticAlert
              variant="destructive"
              title={isEdit ? "Couldn't update cost category" : "Couldn't add cost category"}
              description={submitError.message}
            />
          ) : null}

          {isEdit ? (
            <>
              <View className="gap-1">
                <Text className="text-sm text-muted-foreground">Code</Text>
                <Text className="text-base font-medium text-foreground">{editing?.code}</Text>
              </View>
              <TextField name="name" label="Name" placeholder="e.g. Freight" autoCapitalize="words" />
              <View className="gap-1">
                <Text className="text-sm text-muted-foreground">Kind</Text>
                <Text className="text-base font-medium text-foreground">{kindLabel}</Text>
              </View>
            </>
          ) : (
            <>
              <TextField
                name="code"
                label="Code"
                placeholder="e.g. FREIGHT"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TextField name="name" label="Name" placeholder="e.g. Freight" autoCapitalize="words" />
              <RadioGroup name="kind" label="Kind" options={COST_CATEGORY_KIND_OPTIONS} />
            </>
          )}

          <Button isLoading={creating || updating} onPress={form.handleSubmit(handleSubmit)}>
            <Text>{isEdit ? 'Save changes' : 'Add cost category'}</Text>
          </Button>
        </View>
      </Form>
    </BottomSheet>
  );
});

CostCategoryFormSheet.displayName = 'CostCategoryFormSheet';
