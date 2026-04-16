import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { PasswordField } from '@vritti/quantum-ui/PasswordField';
import { CheckCircle2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAcceptInvite } from '../../hooks/useAcceptInvite';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof schema>;

export const AcceptInvitePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const acceptInviteMutation = useAcceptInvite({
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  // No token in URL — show error state
  if (!token) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Invalid Invitation</h1>
          <p className="text-muted-foreground text-sm">
            This invitation link is missing a required token. Please check the link from your email.
          </p>
        </div>
        <Alert
          variant="destructive"
          title="Missing Token"
          description="The invitation link is invalid or incomplete. Please use the link from your invitation email."
        />
        <div className="text-center">
          <Button variant="link" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Password set successfully — show success state
  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Password Set Successfully</h1>
          <p className="text-muted-foreground text-sm">
            Your account is ready. You can now sign in with your new password.
          </p>
        </div>
        <Button className="w-full" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  // Default — show set password form
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Set Your Password</h1>
        <p className="text-muted-foreground text-sm">
          Complete your account setup by creating a password
        </p>
      </div>
      <Form
        form={form}
        mutation={acceptInviteMutation}
       
        transformSubmit={(data) => ({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        })}
        className="space-y-4"
      >
        <FieldGroup>
          <PasswordField name="password" label="Password" placeholder="Enter your password" />
          <PasswordField name="confirmPassword" label="Confirm Password" placeholder="Confirm your password" />
          <Button type="submit" className="w-full" loadingText="Setting password...">
            Set Password
          </Button>
        </FieldGroup>
      </Form>
    </div>
  );
};
