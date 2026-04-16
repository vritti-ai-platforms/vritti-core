import * as React from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useLookupOrganizations } from '../hooks/auth';
import type { LookupOrganization } from '../services/auth.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('../../../assets/vritti-logo.png');

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface Props {
  onSingleOrgLogin: (args: { email: string; organizationId: string; organizationName: string }) => void;
  onMultipleOrgs: (args: { email: string; organizations: LookupOrganization[] }) => void;
}

export const EmailLookupScreen = ({ onSingleOrgLogin, onMultipleOrgs }: Props) => {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const lookupMutation = useLookupOrganizations({
    onSuccess: (data, email) => {
      if (data.organizations.length === 0) {
        form.setError('root', {
          type: 'No Organizations Found',
          message: 'No organizations were found for this email address.',
        });
        return;
      }

      if (data.organizations.length === 1) {
        const org = data.organizations[0];
        onSingleOrgLogin({
          email,
          organizationId: org.id,
          organizationName: org.name,
        });
        return;
      }

      onMultipleOrgs({
        email,
        organizations: data.organizations,
      });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5">
        {/* Top spacer */}
        <View className="h-12" />

        {/* Logo */}
        <View className="items-center">
          <Image source={logo} className="w-9 h-9 rounded-lg" resizeMode="contain" />
        </View>

        {/* Gap */}
        <View className="h-6" />

        {/* Title */}
        <Text className="text-xl font-semibold text-foreground text-center">
          Enter your email
        </Text>

        {/* Subtitle */}
        <Text className="text-sm text-muted-foreground text-center mt-2">
          We'll find your organizations
        </Text>

        {/* Gap */}
        <View className="h-8" />

        {/* Form with email field and error display */}
        <Form
          form={form}
          mutation={lookupMutation}
          transformSubmit={(data) => data.email}
         
          rootErrorPosition="top"
        >
          <TextField
            name="email"
            label="Email"
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Form>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Footer */}
        <View className="pb-8 pt-4">
          <Button
            isLoading={lookupMutation.isPending}
            onPress={form.handleSubmit((data) => lookupMutation.mutate(data.email))}
            className="h-[52px] rounded-xl"
            loadingText="Looking up..."
          >
            <Text className="text-[15px] font-medium text-primary-foreground">Continue</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};
