import { zodResolver } from '@hookform/resolvers/zod';
import type { PasswordResetFlow } from '@hooks/password-reset';
import { type SetPasswordFormData, setPasswordSchema } from '@schemas/auth';
import { Button } from '@vritti/quantum-ui/Button';
import { Field, FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { PasswordField } from '@vritti/quantum-ui/PasswordField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { KeyRound } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';

interface ResetPasswordStepProps {
  mutation: PasswordResetFlow['resetPasswordMutation'];
}

export const ResetPasswordStep: React.FC<ResetPasswordStepProps> = ({ mutation }) => {
  const form = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/15">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <Typography variant="h3" align="center" className="text-foreground">
          Reset Your Password
        </Typography>
        <Typography variant="body2" align="center" intent="muted">
          Choose a strong password for your account
        </Typography>
      </div>

      <Form form={form} mutation={mutation} transformSubmit={(data) => data.password} showRootError>
        <FieldGroup>
          <PasswordField
            name="password"
            label="New Password"
            placeholder="Enter your new password"
            showStrengthIndicator
          />

          <PasswordField
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter your new password"
            showMatchIndicator
          />

          <Field>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" loadingText="Resetting...">
              Reset Password
            </Button>
          </Field>
        </FieldGroup>
      </Form>
    </div>
  );
};
