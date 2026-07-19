import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSupplierItemSite } from '@/hooks/legal-entity/suppliers';
import {
  type SupplierItemSiteRow,
  type UpdateSupplierItemSiteFormData,
  updateSupplierItemSiteSchema,
} from '@/schemas/suppliers';

interface EditSupplierItemSiteDialogProps {
  supplierId: string;
  itemId: string;
  override: SupplierItemSiteRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierItemSiteDialog: React.FC<EditSupplierItemSiteDialogProps> = ({
  supplierId,
  itemId,
  override,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierItemSiteFormData>({
    resolver: zodResolver(updateSupplierItemSiteSchema),
    defaultValues: {
      leadTimeDays: override.leadTimeDays ?? undefined,
      minOrderQuantity: override.minOrderQuantity ?? undefined,
    },
  });

  const updateMutation = useUpdateSupplierItemSite(supplierId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        rowId: override.id,
        data: {
          leadTimeDays: data.leadTimeDays ?? null,
          minOrderQuantity: data.minOrderQuantity ?? null,
        },
      })}
    >
      <FormSection title="Site Override" contentClassName="block">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField name="leadTimeDays" label="Lead Time (days)" type="number" integer positive placeholder="e.g. 5" />
          <TextField name="minOrderQuantity" label="Min Order Qty" type="number" positive placeholder="e.g. 10" />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
