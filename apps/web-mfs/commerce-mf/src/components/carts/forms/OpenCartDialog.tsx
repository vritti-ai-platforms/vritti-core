import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { useForm } from 'react-hook-form';
import { type OpenCartFormData, openCartSchema } from '@/schemas/carts';
import type { CartsBinding } from '../types';

interface OpenCartDialogProps {
  binding: CartsBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Opens a basket in this workspace.
 *
 * A shopper who already has a basket here gets the one they have rather than a second: the unique on
 * (workspace, party) says there can only be one, and the insert reports which happened.
 */
export const OpenCartDialog = ({ binding, onSuccess, onCancel }: OpenCartDialogProps) => {
  const form = useForm<OpenCartFormData>({
    resolver: zodResolver(openCartSchema),
    defaultValues: { partyId: '' },
  });

  const createMutation = binding.useOpenCart({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <FormSection title="Shopper" contentClassName="grid grid-cols-1 gap-4">
        <Select
          name="partyId"
          label="Shopper"
          placeholder="Search people"
          searchable
          optionsEndpoint="commerce-api/select-api/people"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
        />
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Opening...">
          Open basket
        </Button>
      </DialogActions>
    </Form>
  );
};
