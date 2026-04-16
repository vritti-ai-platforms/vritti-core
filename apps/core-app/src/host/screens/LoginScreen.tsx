import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Form } from '@vritti/quantum-ui-native/Form';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useForm } from 'react-hook-form';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useLogin } from '../hooks/auth';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('../../../assets/vritti-logo.png');

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface Props {
  email: string;
  organizationId: string;
  organizationName: string;
  onAuthenticated: () => void;
}

export const LoginScreen = ({ email, organizationId, organizationName, onAuthenticated }: Props) => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email, password: '' },
  });

  const loginMutation = useLogin({
    onSuccess: () => {
      onAuthenticated();
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
        <Text className="text-xl font-semibold text-foreground text-center">Welcome back</Text>

        {/* Subtitle */}
        <Text className="text-sm text-muted-foreground text-center mt-2">{organizationName}</Text>

        {/* Gap */}
        <View className="h-8" />

        {/* Login form */}
        <Form
          form={form}
          mutation={loginMutation}
          transformSubmit={(data) => ({
            email: data.email,
            password: data.password,
            organizationId,
          })}
          showRootError
          rootErrorPosition="top"
        >
          <TextField name="email" label="Email" keyboardType="email-address" autoCapitalize="none" editable={false} />

          <TextField name="password" label="Password" secureTextEntry autoComplete="password" />
        </Form>

        {/* Forgot password placeholder */}
        <View className="mt-3 items-end">
          <Button variant="link" onPress={() => {}}>
            <Text className="text-sm text-primary">Forgot password?</Text>
          </Button>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Footer */}
        <View className="pb-8 pt-4">
          <Button
            isLoading={loginMutation.isPending}
            onPress={form.handleSubmit((data) =>
              loginMutation.mutate({ email: data.email, password: data.password, organizationId }),
            )}
            className="h-[52px] rounded-xl"
            loadingText="Signing in..."
          >
            <Text className="text-[15px] font-medium text-primary-foreground">Sign In</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};
