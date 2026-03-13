import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Field, FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { OTPField } from '@vritti/quantum-ui/OTPField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowLeft } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';
import type { PasswordResetFlow } from '@hooks/password-reset';
import type { OTPFormData } from '@schemas/auth';
import { otpSchema } from '@schemas/auth';

interface OtpStepProps {
  email: PasswordResetFlow['email'];
  goBack: PasswordResetFlow['goBack'];
  mutation: PasswordResetFlow['verifyOtpMutation'];
  resendOtpMutation: PasswordResetFlow['resendOtpMutation'];
}

export const OtpStep: React.FC<OtpStepProps> = ({
  email,
  goBack,
  mutation,
  resendOtpMutation,
}) => {
  const form = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  // Resets form and navigates back to email step
  const handleBack = () => {
    form.reset();
    goBack();
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBack} className="inline-flex items-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="text-center space-y-2">
        <Typography variant="h3" align="center" className="text-foreground">
          Verify your email
        </Typography>
        <Typography variant="body2" align="center" intent="muted">
          We sent a verification code to
        </Typography>
        <Typography variant="body2" align="center" className="text-foreground font-medium">
          {email}
        </Typography>
      </div>

      <div className="text-center">
        <Typography variant="body2" className="text-foreground font-medium">
          Enter verification code
        </Typography>
      </div>

      <Form
        form={form}
        mutation={mutation}
        transformSubmit={(data) => data.code}
        showRootError
      >
        <FieldGroup>
          <div className="flex justify-center">
            <OTPField
              name="code"
              onChange={(value) => {
                if (value.length === 6 && !mutation.isPending) {
                  form.handleSubmit((data) =>
                    mutation.mutateAsync(data.code),
                  )();
                }
              }}
            />
          </div>

          <Field className="pt-2">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground"
              loadingText="Verifying..."
            >
              Verify
            </Button>
          </Field>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => {
                form.clearErrors();
                form.reset();
                resendOtpMutation.mutate();
              }}
              isLoading={resendOtpMutation.isPending}
              loadingText="Sending..."
              disabled={mutation.isPending}
            >
              Resend code
            </Button>
          </div>
        </FieldGroup>
      </Form>
    </div>
  );
};
