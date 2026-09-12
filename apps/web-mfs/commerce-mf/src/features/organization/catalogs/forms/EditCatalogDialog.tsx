import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateCatalog } from '@/hooks/organization/catalogs';
import { type CatalogData, type UpdateCatalogFormData, updateCatalogSchema } from '@/schemas/catalogs';

interface EditCatalogDialogProps {
  catalog: CatalogData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCatalogDialog: React.FC<EditCatalogDialogProps> = ({ catalog, onSuccess, onCancel }) => {
  const form = useForm<UpdateCatalogFormData>({
    resolver: zodResolver(updateCatalogSchema),
    defaultValues: {
      name: catalog.name,
      taxInclusive: catalog.taxInclusive,
      isActive: catalog.isActive,
    },
  });

  const updateMutation = useUpdateCatalog({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      transformSubmit={(data) => ({ id: catalog.id, data })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" />
        <Switch
          name="taxInclusive"
          label="Prices include tax"
          description="Changing this reinterprets every price already in the catalog — it does not convert them."
        />
        <Switch name="isActive" label="Active" description="A draft catalog is never resolved for any channel" />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};
