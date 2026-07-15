import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { Text } from '@vritti/quantum-ui-native/Text';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import type { UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';
import type { EmailLookupFormValues } from '../../../schemas/auth/emailLookup';

interface EmailLookupFormProps {
  form: UseFormReturn<EmailLookupFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: EmailLookupFormValues) => void;
}

export const EmailLookupForm = ({ form, isSubmitting, onSubmit }: EmailLookupFormProps) => {
  return (
    <Form form={form} rootErrorPosition="top">
      <TextField
        name="email"
        label="Email"
        placeholder="you@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <View className="flex-1" />

      <View className="pb-8 pt-4">
        <Button
          isLoading={isSubmitting}
          onPress={form.handleSubmit(onSubmit)}
          className="h-[52px] rounded-xl"
          loadingText="Looking up..."
        >
          <Text className="text-[15px] font-medium text-primary-foreground">Continue</Text>
        </Button>
      </View>
    </Form>
  );
};
