import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateSupplierSiteItem } from '@/hooks/legal-entity/suppliers';
import {
  type SupplierSiteItemRow,
  type UpdateSupplierSiteItemFormData,
  updateSupplierSiteItemSchema,
} from '@/schemas/suppliers';

interface EditSupplierSiteItemDialogProps {
  supplierId: string;
  itemId: string;
  supplierSiteItem: SupplierSiteItemRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierSiteItemDialog: React.FC<EditSupplierSiteItemDialogProps> = ({
  supplierId,
  itemId,
  supplierSiteItem,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierSiteItemFormData>({
    resolver: zodResolver(updateSupplierSiteItemSchema),
    defaultValues: {
      isPreferred: supplierSiteItem.isPreferred,
      followDefaultLeadTime: !supplierSiteItem.isLeadTimeOverridden,
      leadTimeDays: supplierSiteItem.leadTimeDays,
    },
  });

  const updateMutation = useUpdateSupplierSiteItem(supplierId, itemId, { onSuccess });
  const followDefaultLeadTime = useWatch({ control: form.control, name: 'followDefaultLeadTime' });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierSiteItemId: supplierSiteItem.id,
        data: {
          isPreferred: data.isPreferred,
          ...(data.followDefaultLeadTime ? { followDefaultLeadTime: true } : { leadTimeDays: data.leadTimeDays }),
        },
      })}
    >
      <FormSection title="Site" contentClassName="block">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Switch
              name="followDefaultLeadTime"
              label="Use the item's lead time"
              description="On: follows the supplier item and its later changes; off: this site sets its own"
            />
            <TextField
              name="leadTimeDays"
              label="Lead Time (days)"
              type="number"
              integer
              min={0}
              max={365}
              placeholder="e.g. 5"
              disabled={followDefaultLeadTime}
              description={
                followDefaultLeadTime
                  ? "The supplier item's default lead time applies"
                  : 'Only this site; 0 is the same day as the order'
              }
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
