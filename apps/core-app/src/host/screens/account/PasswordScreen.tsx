import { zodResolver } from '@hookform/resolvers/zod';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Text';
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

  const [changePassword, changePasswordResult] = useChangePassword({
    onCompleted: () => {
      form.reset({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    },
  });

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword({
        variables: {
          input: { currentPassword: values.currentPassword, newPassword: values.newPassword },
        },
      });
    } catch (error) {
      mapApiErrorsToForm(error, form);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <View className="gap-1.5">
        <Text className="text-2xl font-bold text-foreground">Choose a new password</Text>
        <Text className="text-base text-muted-foreground">
          Enter and confirm your new password to keep your account secure.
        </Text>
      </View>
      <ChangePasswordForm form={form} isSubmitting={changePasswordResult.loading} onSubmit={handleSubmit} />
    </ScreenContainer>
  );
};
