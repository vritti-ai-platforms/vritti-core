import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { usePostSupplierQuotationToSite } from '@/hooks/legal-entity/supplier-quotations';
import { type PostSupplierQuotationSiteFormData, postSupplierQuotationSiteSchema } from '@/schemas/supplier-quotations';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';

interface PostQuotationSiteDialogProps {
  supplierId: string;
  quotationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PostQuotationSiteDialog: React.FC<PostQuotationSiteDialogProps> = ({
  supplierId,
  quotationId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PostSupplierQuotationSiteFormData>({ resolver: zodResolver(postSupplierQuotationSiteSchema) });
  const postMutation = usePostSupplierQuotationToSite(supplierId, quotationId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={postMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => data.siteId ?? null}
    >
      <EnrolledSiteSelector
        name="siteId"
        label="Site"
        placeholder="All sites"
        supplierId={supplierId}
        description="Leave empty to post it as the price for all sites; a site picked here gets prices of its own"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Posting...">
          Post Quotation
        </Button>
      </DialogActions>
    </Form>
  );
};
