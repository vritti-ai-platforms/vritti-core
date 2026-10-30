import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierItemLeadTime } from '@/hooks/legal-entity/suppliers';
import { type SetSupplierItemLeadTimeFormData, setSupplierItemLeadTimeSchema } from '@/schemas/suppliers';

interface SetSupplierItemLeadTimeDialogProps {
  supplierId: string;
  supplierItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetSupplierItemLeadTimeDialog: React.FC<SetSupplierItemLeadTimeDialogProps> = ({
  supplierId,
  supplierItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSupplierItemLeadTimeFormData>({
    resolver: zodResolver(setSupplierItemLeadTimeSchema),
  });

  const mutation = useBulkSetSupplierItemLeadTime(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ supplierItemIds, leadTimeDays: data.leadTimeDays ?? null })}
    >
      <TextField
        name="leadTimeDays"
        label="Lead Time (days)"
        type="number"
        integer
        positive
        placeholder="e.g. 5"
        description="Applied to every site of these items that does not set its own. Leave blank to clear it."
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Apply
        </Button>
      </DialogActions>
    </Form>
  );
};
