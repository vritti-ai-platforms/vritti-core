import type { UseMutationResult } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type { AxiosError } from 'axios';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type AssignCatalogFormData, assignCatalogSchema } from '@/schemas/catalog-channels';
import { CatalogSelector } from '@/selectors/catalog';

interface AssignCatalogDialogProps {
  // The grid already names every app and terminal, so the target is implied by the tile that opened
  // this — there is nothing left to pick but the catalog.
  // biome-ignore lint/suspicious/noExplicitAny: one dialog serves several differently-shaped mutations
  mutation: UseMutationResult<any, AxiosError, any>;
  // Turns the single catalogId field into whichever payload that mutation takes
  transformSubmit: (data: AssignCatalogFormData) => unknown;
  submitLabel: string;
  onCancel: () => void;
}

export const AssignCatalogDialog: React.FC<AssignCatalogDialogProps> = ({
  mutation,
  transformSubmit,
  submitLabel,
  onCancel,
}) => {
  const form = useForm<AssignCatalogFormData>({
    resolver: zodResolver(assignCatalogSchema),
    defaultValues: { catalogId: '' },
  });

  return (
    <Form form={form} mutation={mutation} transformSubmit={transformSubmit} resetOnSuccess onCancel={onCancel}>
      <CatalogSelector name="catalogId" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {submitLabel}
        </Button>
      </DialogActions>
    </Form>
  );
};
