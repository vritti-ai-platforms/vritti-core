import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PersonSelector } from '@vritti/quantum-ui/PersonSelector';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddCompanyPerson } from '@/hooks/organization/companies';
import { type AddCompanyPersonFormData, addCompanyPersonSchema, CONTACT_FUNCTION_OPTIONS } from '@/schemas/companies';
import { FunctionsEditor } from '../../party/forms/FunctionsEditor';

interface AddCompanyPersonDialogProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCompanyPersonDialog: React.FC<AddCompanyPersonDialogProps> = ({ companyId, onSuccess, onCancel }) => {
  const form = useForm<AddCompanyPersonFormData>({
    resolver: zodResolver(addCompanyPersonSchema),
    defaultValues: {
      personId: '',
      jobTitle: '',
      functions: [],
    },
  });

  const addMutation = useAddCompanyPerson(companyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        childPartyId: data.personId,
        jobTitle: data.jobTitle,
        functions: data.functions,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Person" contentClassName="grid grid-cols-1 gap-4">
          <PersonSelector name="personId" />
        </FormSection>
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
        <Button type="submit" loadingText="Adding...">
          Add Person
        </Button>
      </DialogActions>
    </Form>
  );
};
