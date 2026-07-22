import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  SOCIAL_PLATFORM_OPTIONS,
  type SocialProfileFormData,
  socialProfileSchema,
} from '@/schemas/party-social-profiles';
import type { SocialProfilesBinding } from '../bindings';

interface AddSocialProfileDialogProps {
  partyId: string;
  binding: SocialProfilesBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSocialProfileDialog: React.FC<AddSocialProfileDialogProps> = ({
  partyId,
  binding,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SocialProfileFormData>({
    resolver: zodResolver(socialProfileSchema),
    defaultValues: {
      platform: 'INSTAGRAM',
      url: '',
    },
  });

  const createMutation = binding.useCreate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ platform: data.platform, url: data.url })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Social Profile" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select name="platform" label="Platform" placeholder="Select platform" options={SOCIAL_PLATFORM_OPTIONS} />
          <TextField name="url" label="Profile URL" placeholder="e.g. https://instagram.com/acmefoods" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Profile
        </Button>
      </DialogActions>
    </Form>
  );
};
