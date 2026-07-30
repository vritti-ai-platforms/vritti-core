import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateRepository } from '@/hooks/organization/repositories';
import { type CreateRepositoryFormData, createRepositorySchema } from '@/schemas/repositories';

interface CreateRepositoryDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateRepositoryDialog: React.FC<CreateRepositoryDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateRepositoryFormData>({
    resolver: zodResolver(createRepositorySchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: true,
    },
  });

  const createMutation = useCreateRepository({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField
          name="name"
          label="Repository name"
          placeholder="e.g. billing-service"
          description="Letters, numbers, dots, underscores, and hyphens"
        />
        <TextField name="description" label="Description" placeholder="What this repository holds" />
        <Switch name="isPrivate" label="Private" description="Only your organization can see this repository" />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create repository
        </Button>
      </DialogActions>
    </Form>
  );
};
