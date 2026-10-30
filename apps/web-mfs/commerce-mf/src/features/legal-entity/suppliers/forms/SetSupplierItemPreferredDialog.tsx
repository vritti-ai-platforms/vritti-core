import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierItemPreferred } from '@/hooks/legal-entity/suppliers';
import { type SetSupplierItemPreferredFormData, setSupplierItemPreferredSchema } from '@/schemas/suppliers';
import { SupplierSiteSelector } from '@/selectors/supplier-site';

interface SetSupplierItemPreferredDialogProps {
  supplierId: string;
  supplierItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetSupplierItemPreferredDialog: React.FC<SetSupplierItemPreferredDialogProps> = ({
  supplierId,
  supplierItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSupplierItemPreferredFormData>({
    resolver: zodResolver(setSupplierItemPreferredSchema),
    defaultValues: { siteIds: [], isPreferred: true },
  });

  const mutation = useBulkSetSupplierItemPreferred(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ supplierItemIds, siteIds: data.siteIds, isPreferred: data.isPreferred })}
    >
      <SupplierSiteSelector name="siteIds" supplierId={supplierId} multiple />
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
