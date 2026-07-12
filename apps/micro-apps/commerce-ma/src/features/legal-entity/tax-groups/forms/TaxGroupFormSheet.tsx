import { zodResolver } from '@hookform/resolvers/zod';
import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { Form } from '@vritti/quantum-ui-native/Form';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Switch } from '@vritti/quantum-ui-native/Switch';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateTaxGroup, useUpdateTaxGroup } from '../../../../hooks/legal-entity/tax-groups';
import { type TaxGroupFormValues, taxGroupSchema } from '../../../../schemas/tax-groups/tax-group';
import type { TaxGroup } from '../../../../types/tax-groups';

interface TaxGroupFormSheetProps {
  // The tax group being edited, or null to create a new one.
  editing: TaxGroup | null;
}

const EMPTY: TaxGroupFormValues = { name: '', taxRates: [{ name: '', rate: '' }] };
const TRASH_ICON = { sfSymbol: 'trash', materialSymbol: 'delete' } as const;
const PLUS_ICON = { sfSymbol: 'plus', materialSymbol: 'add' } as const;

// Create/edit a tax group in a bottom sheet. The tax rates are a nested react-hook-form field array
// (add/remove rows) wired inline via quantum <Form> (dot-path names). `isActive` is a plain Switch
// (create is always active; edit toggles it) managed via local state. Update replaces the whole rates set.
export const TaxGroupFormSheet = forwardRef<BottomSheetRef, TaxGroupFormSheetProps>(({ editing }, ref) => {
  const isEdit = editing != null;
  const [createTaxGroup, { loading: creating, error: createError, reset: resetCreate }] = useCreateTaxGroup();
  const [updateTaxGroup, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateTaxGroup();
  const submitError = isEdit ? updateError : createError;

  const form = useForm<TaxGroupFormValues>({ resolver: zodResolver(taxGroupSchema), defaultValues: EMPTY });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'taxRates' });
  const watchedRates = form.watch('taxRates');
  const combinedTotal = (watchedRates ?? []).reduce((sum, r) => sum + (Number(r?.rate) || 0), 0);

  // isActive is edit-only; local state, default active (a plain Switch, not Form-wired — create is always active).
  const [isActive, setIsActive] = useState(true);

  const seedForm = useCallback(() => {
    form.reset(
      editing
        ? {
            name: editing.name,
            taxRates: editing.taxRates.length
              ? editing.taxRates.map((r) => ({ name: r.name, rate: String(r.rate) }))
              : [{ name: '', rate: '' }],
          }
        : EMPTY,
    );
    setIsActive(editing ? editing.isActive : true);
    resetCreate();
    resetUpdate();
  }, [editing, form, resetCreate, resetUpdate]);

  useEffect(() => {
    seedForm();
  }, [seedForm]);

  const close = () => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  };

  const handleSubmit = async (values: TaxGroupFormValues) => {
    const taxRates = values.taxRates.map((r) => ({ name: r.name.trim(), rate: Number(r.rate) }));
    if (isEdit && editing) {
      // Update sends the FULL rates array (the server replaces all) + the active toggle.
      const result = await updateTaxGroup({
        variables: { id: editing.id, input: { name: values.name.trim(), isActive, taxRates } },
      });
      if (!result.error) close();
      return;
    }
    // Create is always active server-side (no isActive on the create input).
    const result = await createTaxGroup({ variables: { input: { name: values.name.trim(), taxRates } } });
    if (!result.error) close();
  };

  return (
    <BottomSheet
      ref={ref}
      variant="inline"
      title={isEdit ? 'Edit tax group' : 'Add tax group'}
      detents={['auto']}
      onPresent={seedForm}
    >
      <Form form={form}>
        <View className="gap-4 px-2 pb-2">
          {submitError ? (
            <StaticAlert
              variant="destructive"
              title={isEdit ? "Couldn't update tax group" : "Couldn't add tax group"}
              description={submitError.message}
            />
          ) : null}

          <TextField name="name" label="Name" placeholder="e.g. GST 18%" autoCapitalize="characters" />

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Tax rates</Text>
            {fields.map((field, index) => (
              <View key={field.id} className="flex-row items-start gap-2">
                <View className="flex-1">
                  <TextField
                    name={`taxRates.${index}.name`}
                    placeholder="e.g. CGST"
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                <View className="w-24">
                  <TextField name={`taxRates.${index}.rate`} placeholder="0" keyboardType="decimal-pad" />
                </View>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-sm border border-destructive"
                  disabled={fields.length <= 1}
                  onPress={() => remove(index)}
                  accessibilityLabel="Remove rate"
                  hitSlop={8}
                >
                  <DynamicIcon icon={TRASH_ICON} size={14} className="text-destructive" />
                </Button>
              </View>
            ))}
            <Button variant="outline" onPress={() => append({ name: '', rate: '' })}>
              <DynamicIcon icon={PLUS_ICON} size={16} className="text-foreground" />
              <Text>Add rate</Text>
            </Button>
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-xs uppercase tracking-wider text-muted-foreground">Combined</Text>
              <Text className="font-mono text-base font-bold text-foreground">{combinedTotal.toFixed(2)}%</Text>
            </View>
          </View>

          {isEdit ? (
            <Switch
              label="Active"
              description="Inactive tax groups won't apply to new invoices"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          ) : null}

          <Button isLoading={creating || updating} onPress={form.handleSubmit(handleSubmit)}>
            <Text>{isEdit ? 'Save changes' : 'Add tax group'}</Text>
          </Button>
        </View>
      </Form>
    </BottomSheet>
  );
});

TaxGroupFormSheet.displayName = 'TaxGroupFormSheet';
