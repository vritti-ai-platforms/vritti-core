import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSupplierSiteItem } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierSiteItemFormData, addSupplierSiteItemSchema } from '@/schemas/suppliers';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';

interface AddSupplierSiteItemDialogProps {
  supplierId: string;
  itemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierSiteItemDialog: React.FC<AddSupplierSiteItemDialogProps> = ({
  supplierId,
  itemId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierSiteItemFormData>({
    resolver: zodResolver(addSupplierSiteItemSchema),
    defaultValues: {
      isPreferred: false,
    },
  });

  const addMutation = useAddSupplierSiteItem(supplierId, itemId, { onSuccess });

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
          <EnrolledSiteSelector name="siteId" label="Site" placeholder="Select enrolled site" supplierId={supplierId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="leadTimeDays"
              label="Lead Time (days, optional)"
              description="0 is the same day as the order; leave empty to follow the supplier item's lead time"
              type="number"
              integer
              min={0}
              max={365}
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
