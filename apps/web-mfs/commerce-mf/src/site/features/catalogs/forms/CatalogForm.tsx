import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type CatalogData, type CatalogFormData, catalogFormSchema } from '@/schemas/catalogs';
import { useCatalogChannels, useCreateCatalog, useUpdateCatalog } from '@/site/hooks/catalogs';

interface CatalogFormProps {
  catalog?: CatalogData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CatalogForm: React.FC<CatalogFormProps> = ({ catalog, onSuccess, onCancel }) => {
  const isEdit = !!catalog;

  const { data: assignments } = useCatalogChannels(catalog?.id ?? '');

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: catalog
      ? {
          name: catalog.name ?? '',
          taxInclusive: catalog.taxInclusive,
          isActive: catalog.isActive,
          channelIds: [],
        }
      : {
          name: '',
          taxInclusive: false,
          isActive: true,
          channelIds: [],
        },
  });

  useEffect(() => {
    if (!isEdit || !assignments) return;
    form.reset({
      name: catalog.name ?? '',
      taxInclusive: catalog.taxInclusive,
      isActive: catalog.isActive,
      channelIds: assignments.map((a) => a.channelId),
    });
  }, [assignments, catalog, isEdit, form]);

  const createMutation = useCreateCatalog({ onSuccess });
  const updateMutation = useUpdateCatalog({ onSuccess });

  const handleSubmit = (data: CatalogFormData) => {
    if (catalog) {
      return updateMutation.mutateAsync({
        id: catalog.id,
        data: {
          name: data.name.trim(),
          taxInclusive: data.taxInclusive,
          isActive: data.isActive,
          channelIds: data.channelIds ?? [],
        },
      });
    }
    return createMutation.mutateAsync({
      name: data.name.trim(),
      taxInclusive: data.taxInclusive,
      isActive: data.isActive,
      channelIds: data.channelIds ?? [],
    });
  };

  return (
    <Form form={form} onSubmit={handleSubmit} onCancel={onCancel} rootErrorPosition="top" resetOnSuccess={!isEdit}>
      <div className="space-y-4">
        <TextField name="name" label="Name" placeholder="e.g. Online Menu" />
        <Select
          name="channelIds"
          label="Channels"
          description="Sales channels this catalog serves"
          placeholder="Select channels"
          multiple
          searchable
          clearable
          optionsEndpoint="commerce-api/sales-channels/select"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
        />
        <Switch
          name="taxInclusive"
          label="Prices are tax-inclusive"
          description="When on, listed prices already include sales tax."
        />
        <Switch name="isActive" label="Active" description="Inactive catalogs are not used for pricing." />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText={isEdit ? 'Saving...' : 'Creating...'}>
          {isEdit ? 'Save Changes' : 'Create Catalog'}
        </Button>
      </DialogActions>
    </Form>
  );
};
