import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierItemDefaultLeadTime } from '@/hooks/legal-entity/suppliers';
import { type SetSupplierItemDefaultLeadTimeFormData, setSupplierItemDefaultLeadTimeSchema } from '@/schemas/suppliers';

interface SetSupplierItemDefaultLeadTimeDialogProps {
  supplierId: string;
  supplierItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetSupplierItemDefaultLeadTimeDialog: React.FC<SetSupplierItemDefaultLeadTimeDialogProps> = ({
  supplierId,
  supplierItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSupplierItemDefaultLeadTimeFormData>({
    resolver: zodResolver(setSupplierItemDefaultLeadTimeSchema),
    defaultValues: {
      defaultLeadTimeDays: 0,
    },
  });

  const mutation = useBulkSetSupplierItemDefaultLeadTime(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ supplierItemIds, defaultLeadTimeDays: data.defaultLeadTimeDays })}
    >
      <TextField
        name="defaultLeadTimeDays"
        label="Default Lead Time (days)"
        type="number"
        integer
        min={0}
        max={365}
        placeholder="e.g. 5"
        description="0 is the same day as the order; applied to every site of these items that does not set its own"
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
