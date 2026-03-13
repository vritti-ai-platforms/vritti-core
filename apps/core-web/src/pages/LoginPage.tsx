import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { PasswordField } from '@vritti/quantum-ui/PasswordField';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useLogin } from '../hooks/useLogin';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useLogin({
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
        <p className="text-muted-foreground text-sm">Enter your credentials to access the dashboard</p>
      </div>
      <Form form={form} mutation={loginMutation} showRootError className="space-y-4">
        <FieldGroup>
          <TextField name="email" label="Email" type="email" placeholder="you@example.com" />
          <PasswordField name="password" label="Password" placeholder="Enter your password" />
          <Button type="submit" className="w-full" loadingText="Signing in...">
            Sign in
          </Button>
        </FieldGroup>
      </Form>
      <div className="text-center">
        <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => navigate('/forgot-password')}>
          Forgot password?
        </Button>
      </div>
    </div>
  );
};
