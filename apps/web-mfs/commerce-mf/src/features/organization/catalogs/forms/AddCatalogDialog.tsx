import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCatalog } from '@/hooks/organization/catalogs';
import { type CreateCatalogFormData, createCatalogSchema } from '@/schemas/catalogs';

interface AddCatalogDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCatalogDialog: React.FC<AddCatalogDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateCatalogFormData>({
    resolver: zodResolver(createCatalogSchema),
    defaultValues: { name: '', taxInclusive: true },
  });

  const createMutation = useCreateCatalog({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField name="name" label="Name" placeholder="e.g. Retail" />
        <Switch
          name="taxInclusive"
          label="Prices include tax"
          description="Indian retail prices are inclusive; wholesale and export are not. This applies to every price in the catalog."
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Catalog
        </Button>
      </DialogActions>
    </Form>
  );
};
