import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Alert } from '@vritti/quantum-ui-native/Alert';
import { Form } from '@vritti/quantum-ui-native/Form';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Typography';
import React from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { type EmailLookupFormValues, emailLookupSchema } from '../../../schemas/auth/emailLookup';

interface EmailLookupFormProps {
  isSubmitting: boolean;
  formError?: string;
  onSubmit: (email: string) => void;
}

export const EmailLookupForm = ({ isSubmitting, formError, onSubmit }: EmailLookupFormProps) => {
  const form = useForm<EmailLookupFormValues>({
    resolver: zodResolver(emailLookupSchema),
    defaultValues: { email: '' },
  });

  React.useEffect(() => {
    if (formError) {
      form.setError('root', {
        type: 'lookup',
        message: formError,
      });
      return;
    }

    form.clearErrors('root');
  }, [form, formError]);

  return (
    <Form form={form} rootErrorPosition="top">
      {formError ? <Alert variant="destructive" title="Organization Not Found" className="mb-4" /> : null}
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
          onPress={form.handleSubmit((data) => onSubmit(data.email))}
          className="h-[52px] rounded-xl"
          loadingText="Looking up..."
        >
          <Text className="text-[15px] font-medium text-primary-foreground">Continue</Text>
        </Button>
      </View>
    </Form>
  );
};
