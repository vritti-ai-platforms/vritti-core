import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierItemScheme } from '@/hooks/suppliers';
import {
  type FreeSchemeMode,
  freeSchemeModeLabels,
  type SetSupplierItemSchemeFormData,
  setSupplierItemSchemeSchema,
} from '@/schemas/suppliers';

const schemeModeOptions = (Object.keys(freeSchemeModeLabels) as FreeSchemeMode[]).map((mode) => ({
  value: mode,
  label: freeSchemeModeLabels[mode],
}));

interface SetSupplierItemSchemeDialogProps {
  supplierId: string;
  supplierItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetSupplierItemSchemeDialog: React.FC<SetSupplierItemSchemeDialogProps> = ({
  supplierId,
  supplierItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSupplierItemSchemeFormData>({
    resolver: zodResolver(setSupplierItemSchemeSchema),
    defaultValues: {
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      schemeMode: 'none',
    },
  });

  const mutation = useBulkSetSupplierItemScheme(supplierId, { onSuccess });
  const schemeMode = form.watch('schemeMode');

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierItemIds,
        schemeBuyQty: schemeMode === 'none' ? undefined : (data.schemeBuyQty ?? undefined),
        schemeFreeQty: schemeMode === 'none' ? undefined : (data.schemeFreeQty ?? undefined),
        schemeMode: data.schemeMode,
      })}
    >
      <p className="text-sm text-muted-foreground">
        Applying to {supplierItemIds.length} selected item{supplierItemIds.length === 1 ? '' : 's'}.
      </p>
      <div className="flex flex-col gap-4">
        <RadioGroup name="schemeMode" label="Scheme" options={schemeModeOptions} orientation="horizontal" />
        {schemeMode !== 'none' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="schemeBuyQty" label="Buy Qty" type="number" positive />
            <TextField name="schemeFreeQty" label="Free Qty" type="number" positive />
          </div>
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Set Scheme
        </Button>
      </div>
    </Form>
  );
};
