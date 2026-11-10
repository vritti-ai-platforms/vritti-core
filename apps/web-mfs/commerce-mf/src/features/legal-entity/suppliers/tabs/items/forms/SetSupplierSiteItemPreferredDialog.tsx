import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierSiteItemPreferred } from '@/hooks/legal-entity/suppliers';
import { type SetSupplierSiteItemPreferredFormData, setSupplierSiteItemPreferredSchema } from '@/schemas/suppliers';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';

interface SetSupplierSiteItemPreferredDialogProps {
  supplierId: string;
  supplierItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetSupplierSiteItemPreferredDialog: React.FC<SetSupplierSiteItemPreferredDialogProps> = ({
  supplierId,
  supplierItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSupplierSiteItemPreferredFormData>({
    resolver: zodResolver(setSupplierSiteItemPreferredSchema),
    defaultValues: { siteIds: [], isPreferred: true },
  });

  const mutation = useBulkSetSupplierSiteItemPreferred(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ supplierItemIds, siteIds: data.siteIds, isPreferred: data.isPreferred })}
    >
      <EnrolledSiteSelector name="siteIds" label="Sites" supplierId={supplierId} multiple />
      <Switch
        name="isPreferred"
        label="Preferred supplier"
        description="Replaces any other preferred supplier for these items at the chosen sites. Items not set up at a site are skipped."
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
