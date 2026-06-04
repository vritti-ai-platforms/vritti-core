import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { PasswordField } from '@vritti/quantum-ui-native/PasswordField';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Typography';
import type { UseFormReturn } from 'react-hook-form';
import type { ChangePasswordFormValues } from '../../../schemas/account/changePassword';

interface ChangePasswordFormProps {
  form: UseFormReturn<ChangePasswordFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: ChangePasswordFormValues) => void;
}

export const ChangePasswordForm = ({ form, isSubmitting, onSubmit }: ChangePasswordFormProps) => {
  // Watching newPassword keeps the strength indicator and the confirm-match
  // indicator on the third field reactive without the user having to blur.
  const newPassword = form.watch('newPassword');

  return (
    <Form form={form} rootErrorPosition="top">
      <PasswordField
        name="currentPassword"
        label="Current password"
        placeholder="Enter current password"
        autoComplete="current-password"
      />

      <PasswordField
        name="newPassword"
        label="New password"
        placeholder="Enter new password"
        autoComplete="new-password"
        showStrengthIndicator
      />

      <PasswordField
        name="confirmNewPassword"
        label="Confirm new password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        showMatchIndicator
        matchPassword={newPassword}
      />

      <StaticAlert
        variant="info"
        title="Password requirements"
        description="At least 8 characters with uppercase, lowercase, a number, and a special character."
      />

      <Button isLoading={isSubmitting} onPress={form.handleSubmit(onSubmit)} loadingText="Updating...">
        <Text>Update password</Text>
      </Button>
    </Form>
  );
};
