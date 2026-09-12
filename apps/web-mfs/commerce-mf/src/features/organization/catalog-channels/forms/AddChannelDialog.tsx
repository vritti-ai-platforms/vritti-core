import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { LegalEntitySelector } from '@vritti/quantum-ui/selects/legal-entity';
import { SiteSelector } from '@vritti/quantum-ui/selects/site';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateCatalogChannel } from '@/hooks/organization/catalog-channels';
import {
  CATALOG_CHANNEL_TYPES,
  CHANNEL_TYPE_META,
  type CreateCatalogChannelFormData,
  createCatalogChannelSchema,
} from '@/schemas/catalog-channels';

interface AddChannelDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddChannelDialog: React.FC<AddChannelDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateCatalogChannelFormData>({
    resolver: zodResolver(createCatalogChannelSchema),
    defaultValues: { catalogId: '', type: 'APP', legalEntityId: null, siteId: null, appId: null, terminalId: null },
  });

  const type = useWatch({ control: form.control, name: 'type' });
  const legalEntityId = useWatch({ control: form.control, name: 'legalEntityId' });
  const createMutation = useCreateCatalogChannel({ onSuccess });

  // An outlet belongs to a company and a till to an outlet, so narrowing resets what sits below it
  const handleLegalEntityChange = () => {
    form.setValue('siteId', null);
    form.setValue('terminalId', null);
  };

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <Select
          name="type"
          label="Channel type"
          options={CATALOG_CHANNEL_TYPES.map((value) => ({
            value,
            label: CHANNEL_TYPE_META[value].label,
            description: CHANNEL_TYPE_META[value].description,
          }))}
          description="Decided by the API surface a caller authenticates against — never sent by the caller."
        />
        <Select
          name="catalogId"
          label="Sells"
          placeholder="Select catalog"
          searchable
          optionsEndpoint="commerce-api/select-api/catalogs"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
        />
        <LegalEntitySelector
          name="legalEntityId"
          label="Company"
          placeholder="Every company"
          onOptionSelect={handleLegalEntityChange}
          description="Leave empty and this binding covers the whole organization."
        />
        {legalEntityId ? (
          <SiteSelector name="siteId" label="Outlet" placeholder="Every outlet" params={{ legalEntityId }} />
        ) : null}
        {type === 'POS' && legalEntityId ? (
          <Select
            name="terminalId"
            label="Till"
            placeholder="Every till"
            searchable
            optionsEndpoint="commerce-api/select-api/pos-terminals"
            fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
            description="Name one only to give a single till different prices."
          />
        ) : null}
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Channel
        </Button>
      </DialogActions>
    </Form>
  );
};
