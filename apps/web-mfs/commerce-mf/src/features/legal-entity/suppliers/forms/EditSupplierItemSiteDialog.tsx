import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateSupplierItemSite } from '@/hooks/legal-entity/suppliers';
import {
  type SupplierItemSiteRow,
  type UpdateSupplierItemSiteFormData,
  updateSupplierItemSiteSchema,
} from '@/schemas/suppliers';

interface EditSupplierItemSiteDialogProps {
  supplierId: string;
  itemId: string;
  siteItem: SupplierItemSiteRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierItemSiteDialog: React.FC<EditSupplierItemSiteDialogProps> = ({
  supplierId,
  itemId,
  siteItem,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierItemSiteFormData>({
    resolver: zodResolver(updateSupplierItemSiteSchema),
    defaultValues: {
      isPreferred: siteItem.isPreferred,
      followItemLeadTime: !siteItem.isLeadTimeOverridden,
      leadTimeDays: siteItem.leadTimeDays ?? undefined,
    },
  });

  const updateMutation = useUpdateSupplierItemSite(supplierId, itemId, { onSuccess });
  const followItemLeadTime = useWatch({ control: form.control, name: 'followItemLeadTime' });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        rowId: siteItem.id,
        data: {
          isPreferred: data.isPreferred,
          ...(data.followItemLeadTime ? { followItemLeadTime: true } : { leadTimeDays: data.leadTimeDays ?? null }),
        },
      })}
    >
      <FormSection title="Site" contentClassName="block">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Switch
              name="followItemLeadTime"
              label="Use the item's lead time"
              description="On: follows the supplier item and its later changes; off: this site sets its own"
            />
            <TextField
              name="leadTimeDays"
              label="Lead Time (days)"
              type="number"
              integer
              positive
              placeholder="e.g. 5"
              disabled={followItemLeadTime}
              description={followItemLeadTime ? "The supplier item's lead time applies" : 'Only this site'}
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
