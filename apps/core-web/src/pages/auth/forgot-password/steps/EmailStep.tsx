import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Field, FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowLeft, Mail } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import type { PasswordResetFlow } from '@hooks/password-reset';
import type { ForgotPasswordFormData } from '@schemas/auth';
import { forgotPasswordSchema } from '@schemas/auth';

interface EmailStepProps {
  mutation: PasswordResetFlow['forgotPasswordMutation'];
}

export const EmailStep: React.FC<EmailStepProps> = ({ mutation }) => {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  return (
    <div className="space-y-6">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <div className="text-center space-y-2">
        <Typography variant="h3" align="center" className="text-foreground">
          Reset your password
        </Typography>
        <Typography variant="body2" align="center" intent="muted">
          Enter your email to receive a verification code
        </Typography>
      </div>

      <Form form={form} mutation={mutation} transformSubmit={(data) => data.email} showRootError>
        <FieldGroup>
          <TextField
            name="email"
            label="Email Address"
            placeholder="you@company.com"
            startAdornment={<Mail className="h-4 w-4 text-muted-foreground" />}
          />

          <Field>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground"
              loadingText="Sending..."
            >
              Send reset code
            </Button>
          </Field>
        </FieldGroup>
      </Form>
    </div>
  );
};
