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
  excludeCatalogIds?: (string | null | undefined)[];
  mutation: UseMutationResult<any, AxiosError, any>;
  transformSubmit: (data: AssignCatalogFormData) => unknown;
  submitLabel: string;
  onCancel: () => void;
}

export const AssignCatalogDialog: React.FC<AssignCatalogDialogProps> = ({
  excludeCatalogIds,
  mutation,
  transformSubmit,
  submitLabel,
  onCancel,
}) => {
  const form = useForm<AssignCatalogFormData>({
    resolver: zodResolver(assignCatalogSchema),
  });

  // The endpoint takes one comma-separated list, not repeated params
  const excludeIds = (excludeCatalogIds ?? []).filter(Boolean).join(',');

  return (
    <Form form={form} mutation={mutation} transformSubmit={transformSubmit} resetOnSuccess onCancel={onCancel}>
      <CatalogSelector name="catalogId" params={excludeIds ? { excludeIds } : undefined} />
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
