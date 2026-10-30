import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSupplierItemSite } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierItemSiteFormData, addSupplierItemSiteSchema } from '@/schemas/suppliers';
import { SupplierSiteSelector } from '@/selectors/supplier-site';

interface AddSupplierItemSiteDialogProps {
  supplierId: string;
  itemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemSiteDialog: React.FC<AddSupplierItemSiteDialogProps> = ({
  supplierId,
  itemId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierItemSiteFormData>({
    resolver: zodResolver(addSupplierItemSiteSchema),
    defaultValues: {
      isPreferred: false,
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
        isPreferred: data.isPreferred,
        leadTimeDays: data.leadTimeDays ?? undefined,
      })}
    >
      <FormSection title="Site" contentClassName="block">
        <div className="flex flex-col gap-4">
          <SupplierSiteSelector name="siteId" label="Site" placeholder="Select enrolled site" supplierId={supplierId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="leadTimeDays"
              label="Lead Time (days, optional)"
              description="Leave empty to follow the supplier item's lead time"
              type="number"
              integer
              positive
              placeholder="e.g. 5"
            />
          </div>
          <Switch
            name="isPreferred"
            label="Preferred supplier"
            description="Replaces any other preferred supplier for this item at the site"
          />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Site
        </Button>
      </DialogActions>
    </Form>
  );
};
