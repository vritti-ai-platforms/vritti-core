import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { Form } from '@vritti/quantum-ui-native/Form';
import { PasswordField } from '@vritti/quantum-ui-native/PasswordField';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useChangePassword } from '../../hooks/account';
import { type ChangePasswordFormValues, changePasswordSchema } from '../../schemas/account/changePassword';

export const PasswordScreen = () => {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Watching newPassword keeps the strength indicator and the confirm-match
  // indicator on the third field reactive without the user having to blur.
  const newPassword = form.watch('newPassword');

  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      form.reset({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    },
  });

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <View className="gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              form={form}
              mutation={changePasswordMutation}
              transformSubmit={(data) => ({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
              })}
              showRootError
              rootErrorPosition="top"
            >
              <PasswordField
                name="currentPassword"
                label="Current password"
                placeholder="Enter current password"
                autoComplete="current-password"
              />

              <PasswordField
                name="newPassword"
                label="New password"
                placeholder="Enter new password"
                autoComplete="new-password"
                showStrengthIndicator
              />

              <PasswordField
                name="confirmNewPassword"
                label="Confirm new password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                showMatchIndicator
                matchPassword={newPassword}
              />

              <StaticAlert
                variant="info"
                title="Password requirements"
                description="At least 8 characters with uppercase, lowercase, a number, and a special character."
              />

              {/* `submit` is a runtime convention recognised by <Form> — it
                  auto-wires onPress to the form's handleSubmit and forwards
                  isSubmitting. It's not part of ButtonProps' static type, so
                  we attach it via a typed cast. */}
              <Button {...({ submit: true } as { submit: boolean })} loadingText="Updating...">
                <Text>Update password</Text>
              </Button>
            </Form>
          </CardContent>
        </Card>
      </View>
    </ScreenContainer>
  );
};
