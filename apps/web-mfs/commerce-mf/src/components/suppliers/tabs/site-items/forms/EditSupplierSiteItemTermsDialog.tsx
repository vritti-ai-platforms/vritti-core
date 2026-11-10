import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type SupplierSiteItemTerms,
  type UpdateSupplierSiteItemFormData,
  updateSupplierSiteItemSchema,
} from '@/schemas/suppliers';
import type { UseUpdateSiteItem } from '../../../types';

interface EditSupplierSiteItemTermsDialogProps {
  useUpdateTerms: UseUpdateSiteItem;
  supplierId: string;
  itemId: string;
  supplierSiteItemId: string;
  terms: SupplierSiteItemTerms;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierSiteItemTermsDialog: React.FC<EditSupplierSiteItemTermsDialogProps> = ({
  useUpdateTerms,
  supplierId,
  itemId,
  supplierSiteItemId,
  terms,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierSiteItemFormData>({
    resolver: zodResolver(updateSupplierSiteItemSchema),
    defaultValues: {
      isPreferred: terms.isPreferred,
      followDefaultLeadTime: !terms.isLeadTimeOverridden,
      leadTimeDays: terms.leadTimeDays,
    },
  });

  const updateMutation = useUpdateTerms(supplierId, itemId, { onSuccess });
  const followDefaultLeadTime = useWatch({ control: form.control, name: 'followDefaultLeadTime' });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierSiteItemId,
        data: {
          isPreferred: data.isPreferred,
          ...(data.followDefaultLeadTime ? { followDefaultLeadTime: true } : { leadTimeDays: data.leadTimeDays }),
        },
      })}
    >
      <FormSection title="Site Terms" contentClassName="block">
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
