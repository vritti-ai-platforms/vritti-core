import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { mapApiErrorsToForm } from '@vritti/quantum-ui-native/utils';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { useChangePassword } from '../../hooks/account';
import { type ChangePasswordFormValues, changePasswordSchema } from '../../schemas/account/changePassword';
import { ChangePasswordForm } from './form/ChangePasswordForm';

export const PasswordScreen = () => {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      form.reset({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    },
  });

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    } catch (error) {
      mapApiErrorsToForm(error, form);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <View className="gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm
              form={form}
              isSubmitting={changePasswordMutation.isPending}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </View>
    </ScreenContainer>
  );
};
