import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierItemScheme } from '@/hooks/suppliers';
import { type SetSupplierItemSchemeFormData, setSupplierItemSchemeSchema } from '@/schemas/suppliers';

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
      hasScheme: false,
    },
  });

  const mutation = useBulkSetSupplierItemScheme(supplierId, { onSuccess });
  const hasScheme = form.watch('hasScheme');

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierItemIds,
        schemeBuyQty: data.hasScheme ? (data.schemeBuyQty ?? undefined) : undefined,
        schemeFreeQty: data.hasScheme ? (data.schemeFreeQty ?? undefined) : undefined,
        hasScheme: data.hasScheme,
      })}
    >
      <p className="text-sm text-muted-foreground">
        Applying to {supplierItemIds.length} selected item{supplierItemIds.length === 1 ? '' : 's'}.
      </p>
      <div className="flex flex-col gap-4">
        <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
        {hasScheme && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="schemeBuyQty" label="Buy Qty" type="number" integer positive />
            <TextField name="schemeFreeQty" label="Free Qty" type="number" integer positive />
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
