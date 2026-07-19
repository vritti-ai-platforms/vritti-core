import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { SiteSelector } from '@vritti/quantum-ui/selects/site';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSupplierItemSite } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierItemSiteFormData, addSupplierItemSiteSchema } from '@/schemas/suppliers';

interface AddSupplierItemSiteDialogProps {
  supplierId: string;
  itemId: string;
  standingLeadTimeDays: number | null;
  standingMinOrderQuantity: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemSiteDialog: React.FC<AddSupplierItemSiteDialogProps> = ({
  supplierId,
  itemId,
  standingLeadTimeDays,
  standingMinOrderQuantity,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierItemSiteFormData>({
    resolver: zodResolver(addSupplierItemSiteSchema),
    defaultValues: {
      siteId: '',
      leadTimeDays: standingLeadTimeDays ?? undefined,
      minOrderQuantity: standingMinOrderQuantity ?? undefined,
    },
  });

  const addMutation = useAddSupplierItemSite(supplierId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteId: data.siteId,
        leadTimeDays: data.leadTimeDays ?? undefined,
        minOrderQuantity: data.minOrderQuantity ?? undefined,
      })}
    >
      <FormSection title="Site Override" contentClassName="block">
        <div className="flex flex-col gap-4">
          <SiteSelector name="siteId" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="leadTimeDays"
              label="Lead Time (days)"
              type="number"
              integer
              positive
              placeholder="e.g. 5"
            />
            <TextField name="minOrderQuantity" label="Min Order Qty" type="number" positive placeholder="e.g. 10" />
          </div>
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Override
        </Button>
      </DialogActions>
    </Form>
  );
};
