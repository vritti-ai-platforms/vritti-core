import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateCompanyPerson } from '@/hooks/organization/companies';
import {
  CONTACT_FUNCTION_OPTIONS,
  type CompanyPersonRow,
  type UpdateCompanyPersonFormData,
  updateCompanyPersonSchema,
} from '@/schemas/companies';
import { FunctionsEditor } from '../../party/forms/FunctionsEditor';

interface EditCompanyPersonDialogProps {
  companyId: string;
  person: CompanyPersonRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCompanyPersonDialog: React.FC<EditCompanyPersonDialogProps> = ({
  companyId,
  person,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateCompanyPersonFormData>({
    resolver: zodResolver(updateCompanyPersonSchema),
    defaultValues: {
      jobTitle: person.jobTitle ?? '',
      functions: person.functions.map((item) => ({ function: item.function, isPrimary: item.isPrimary })),
    },
  });

  const updateMutation = useUpdateCompanyPerson(companyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        companyPersonId: person.id,
        data: {
          jobTitle: data.jobTitle || null,
          functions: data.functions,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Role" contentClassName="grid grid-cols-1 gap-4">
          <TextField name="jobTitle" label="Job Title" placeholder="e.g. Procurement Manager" />
        </FormSection>
        <FormSection title="Handles" contentClassName="block">
          <FunctionsEditor name="functions" label="Contact Functions" options={CONTACT_FUNCTION_OPTIONS} />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
