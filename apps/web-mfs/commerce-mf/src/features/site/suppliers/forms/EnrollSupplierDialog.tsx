import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useEnrollSiteSupplier } from '@/hooks/site/suppliers';
import { type EnrollSiteSupplierFormData, enrollSiteSupplierSchema } from '@/schemas/site-suppliers';

interface EnrollSupplierDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnrollSupplierDialog: React.FC<EnrollSupplierDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<EnrollSiteSupplierFormData>({
    resolver: zodResolver(enrollSiteSupplierSchema),
    defaultValues: { supplierId: '' },
  });

  const enrollMutation = useEnrollSiteSupplier({ onSuccess });

  return (
    <Form form={form} mutation={enrollMutation} resetOnSuccess onCancel={onCancel}>
      <FormSection title="Supplier" contentClassName="block">
        <SupplierSelector name="supplierId" params={{ enrollable: true }} />
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Enrolling...">
          Enroll Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
