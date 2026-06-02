import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { PasswordField } from '@vritti/quantum-ui-native/PasswordField';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Text';
import type { UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';
import type { LoginFormValues } from '../../../schemas/auth/login';

interface LoginFormProps {
  form: UseFormReturn<LoginFormValues>;
  isSubmitting: boolean;
  isPreparingTenantURL: boolean;
  onSubmit: (values: LoginFormValues) => void;
}

export const LoginForm = ({ form, isSubmitting, isPreparingTenantURL, onSubmit }: LoginFormProps) => {
  return (
    <Form form={form} rootErrorPosition="top">
      <TextField name="email" label="Email" keyboardType="email-address" autoCapitalize="none" editable={false} />
      <PasswordField name="password" label="Password" autoComplete="password" />

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
