import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Checkbox } from '@vritti/quantum-ui-native/Checkbox';
import { Form } from '@vritti/quantum-ui-native/Form';
import { RadioGroup } from '@vritti/quantum-ui-native/RadioGroup';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { UomSelector } from '@vritti/quantum-ui-native/selects/uom';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useCreateUom, useUpdateUom } from '../../../../hooks/organization/uom';
import { type UomFormValues, uomSchema } from '../../../../schemas/uom/uom';
import type { Uom } from '../../../../types/uom';

interface UomUnitFormSheetProps {
  dimensionId: string;
  // The unit being edited, or null to create a new one.
  editing: Uom | null;
}

const EMPTY: UomFormValues = {
  kind: 'base',
  name: '',
  symbol: '',
  baseUnitId: '',
  uomQty: '',
  baseUomQty: '',
};

const KIND_OPTIONS = [
  { value: 'base', label: 'Base unit', description: 'A standalone unit — no conversion' },
  { value: 'derived', label: 'Derived unit', description: 'Converts to a base unit of this dimension' },
];

// Create/edit a unit in a bottom sheet. `kind` (base/derived) is UI-only and FIXED on edit (matching the
// web) — you can't re-parent a unit. Derived units collect a base unit + the uomQty:baseUomQty ratio.
export const UomUnitFormSheet = forwardRef<BottomSheetRef, UomUnitFormSheetProps>(({ dimensionId, editing }, ref) => {
  const isEdit = editing != null;
  const [createUom, { loading: creating, error: createError, reset: resetCreate }] = useCreateUom(dimensionId);
  const [updateUom, { loading: updating, error: updateError, reset: resetUpdate }] = useUpdateUom();
  const submitError = isEdit ? updateError : createError;

  // Base-unit symbol drives the "Count of <symbol>" label. On edit it's fixed (from the unit); on create
  // it's captured from the base-unit picker.
  const [selectedBaseSymbol, setSelectedBaseSymbol] = useState<string | null>(null);
  // allowDecimal is a plain Checkbox (create-only; not in the Uom response, so not editable on edit).
  const [allowDecimal, setAllowDecimal] = useState(false);

  const form = useForm<UomFormValues>({ resolver: zodResolver(uomSchema), defaultValues: EMPTY });
  const kind = form.watch('kind');
  const symbol = form.watch('symbol');
  const baseSymbol = isEdit ? (editing?.baseUnitSymbol ?? null) : selectedBaseSymbol;

  const seedForm = useCallback(() => {
    form.reset(
      editing
        ? {
            kind: editing.baseUnitId ? 'derived' : 'base',
            name: editing.name,
            symbol: editing.symbol,
            baseUnitId: editing.baseUnitId ?? '',
            uomQty: String(editing.uomQty),
            baseUomQty: String(editing.baseUomQty),
          }
        : EMPTY,
    );
    setSelectedBaseSymbol(null);
    setAllowDecimal(false);
    resetCreate();
    resetUpdate();
  }, [editing, form, resetCreate, resetUpdate]);

  useEffect(() => {
    seedForm();
  }, [seedForm]);

  const close = () => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  };

  const handleSubmit = async (values: UomFormValues) => {
    const isDerived = values.kind === 'derived';
    if (isEdit && editing) {
      // Kind + base unit are fixed on edit; only name/symbol/ratio change.
      const input = {
        name: values.name.trim(),
        symbol: values.symbol.trim(),
        ...(isDerived ? { uomQty: Number(values.uomQty), baseUomQty: Number(values.baseUomQty) } : {}),
      };
      const result = await updateUom({ variables: { id: editing.id, input } });
      if (!result.error) close();
      return;
    }
    const input = {
      dimensionId,
      name: values.name.trim(),
      symbol: values.symbol.trim(),
      allowDecimal,
      ...(isDerived
        ? { baseUnitId: values.baseUnitId, uomQty: Number(values.uomQty), baseUomQty: Number(values.baseUomQty) }
        : {}),
    };
    const result = await createUom({ variables: { input } });
    if (!result.error) close();
  };

  return (
    <BottomSheet
      ref={ref}
      variant="inline"
      title={isEdit ? 'Edit unit' : 'Add unit'}
      detents={['auto']}
      onPresent={seedForm}
    >
      <Form form={form}>
        <View className="gap-4 px-4 pb-4">
          {submitError ? (
            <StaticAlert
              variant="destructive"
              title={isEdit ? "Couldn't update unit" : "Couldn't add unit"}
              description={submitError.message}
            />
          ) : null}

          {isEdit ? (
            <View className="gap-1">
              <Text className="text-sm text-muted-foreground">Type</Text>
              <Text className="text-base font-medium text-foreground">
                {kind === 'derived' ? 'Derived unit' : 'Base unit'}
              </Text>
            </View>
          ) : (
            <RadioGroup name="kind" label="Type" options={KIND_OPTIONS} />
          )}

          <TextField name="name" label="Name" placeholder="e.g. Kilogram" autoCapitalize="words" />
          <TextField name="symbol" label="Symbol" placeholder="e.g. kg" autoCapitalize="none" autoCorrect={false} />

          {kind === 'derived' ? (
            <>
              {isEdit ? (
                <View className="gap-1">
                  <Text className="text-sm text-muted-foreground">Base unit</Text>
                  <Text className="text-base font-medium text-foreground">{editing?.baseUnitSymbol ?? '—'}</Text>
                </View>
              ) : (
                <UomSelector
                  name="baseUnitId"
                  label="Base unit"
                  placeholder="Select base unit"
                  params={{ dimensionId, baseOnly: true }}
                  fieldKeys={{ additionalKeys: 'symbol' }}
                  onOptionSelect={(opt) =>
                    setSelectedBaseSymbol((opt?.additionals?.symbol as string | undefined) ?? null)
                  }
                />
              )}
              <TextField name="uomQty" label={`Count of ${symbol || 'this unit'}`} keyboardType="number-pad" />
              <TextField name="baseUomQty" label={`Count of ${baseSymbol ?? 'base unit'}`} keyboardType="number-pad" />
            </>
          ) : null}

          {isEdit ? null : (
            <Checkbox label="Allow decimal quantities" checked={allowDecimal} onCheckedChange={setAllowDecimal} />
          )}

          <Button isLoading={creating || updating} onPress={form.handleSubmit(handleSubmit)}>
            <Text>{isEdit ? 'Save changes' : 'Add unit'}</Text>
          </Button>
        </View>
      </Form>
    </BottomSheet>
  );
});

UomUnitFormSheet.displayName = 'UomUnitFormSheet';
