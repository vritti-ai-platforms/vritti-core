import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Typography';
import React from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { loginSchema, type LoginFormValues } from '../../../schemas/auth/login';

interface LoginFormProps {
  email: string;
  formError?: string;
  isSubmitting: boolean;
  isPreparingTenantURL: boolean;
  onSubmit: (values: LoginFormValues) => void;
}

export const LoginForm = ({
  email,
  formError,
  isSubmitting,
  isPreparingTenantURL,
  onSubmit,
}: LoginFormProps) => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email, password: '' },
  });

  React.useEffect(() => {
    form.reset({ email, password: '' });
  }, [email, form]);

  React.useEffect(() => {
    if (formError) {
      form.setError('root', {
        type: 'login',
        message: formError,
      });
      return;
    }

    form.clearErrors('root');
  }, [form, formError]);

  return (
    <Form form={form} rootErrorPosition="top">
      <TextField name="email" label="Email" keyboardType="email-address" autoCapitalize="none" editable={false} />
      <TextField name="password" label="Password" secureTextEntry autoComplete="password" />

      <View className="mt-3 items-end">
        <Button variant="link" onPress={() => {}}>
          <Text className="text-sm text-primary">Forgot password?</Text>
        </Button>
      </View>

      <View className="flex-1" />

      <View className="pb-8 pt-4">
        <Button
          isLoading={isPreparingTenantURL || isSubmitting}
          disabled={isPreparingTenantURL}
          onPress={form.handleSubmit(onSubmit)}
          className="h-[52px] rounded-xl"
          loadingText={isPreparingTenantURL ? 'Preparing workspace...' : 'Signing in...'}
        >
          <Text className="text-[15px] font-medium text-primary-foreground">Sign In</Text>
        </Button>
      </View>
    </Form>
  );
};
