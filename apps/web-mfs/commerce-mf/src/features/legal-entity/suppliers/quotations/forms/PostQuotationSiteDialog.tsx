import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { usePostSupplierQuotationToSite } from '@/hooks/legal-entity/supplier-quotations';
import { type PostSupplierQuotationSiteFormData, postSupplierQuotationSiteSchema } from '@/schemas/supplier-quotations';
import { SupplierSiteSelector } from '@/selectors/supplier-site';

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
      transformSubmit={(data) => data.siteId}
    >
      <SupplierSiteSelector
        name="siteId"
        label="Site"
        placeholder="Select an enrolled site"
        supplierId={supplierId}
        description="Every line becomes this site's price from the quotation's start date"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Posting...">
          Post to Site
        </Button>
      </DialogActions>
    </Form>
  );
};
