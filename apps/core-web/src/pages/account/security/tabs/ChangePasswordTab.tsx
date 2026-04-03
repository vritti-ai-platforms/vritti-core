import { SecurityTabCard } from '@components/account/security/SecurityTabCard';
import { useChangePassword } from '@hooks/account/security';
import type { ChangePasswordFormData } from '@/schemas/account';
import { changePasswordSchema } from '@/schemas/account';
import { Button } from '@vritti/quantum-ui/Button';
import { FieldGroup, Form } from '@vritti/quantum-ui/Form';
import { PasswordField } from '@vritti/quantum-ui/PasswordField';
import { Separator } from '@vritti/quantum-ui/Separator';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const ChangePasswordTab: React.FC = () => {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPassword = form.watch('newPassword');

  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      form.reset({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    },
  });

  return (
    <SecurityTabCard title="Change Password" description="Update your password to keep your account secure">
      <Form
        form={form}
        mutation={changePasswordMutation}
        transformSubmit={(data) => ({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })}
        showRootError
      >
        <FieldGroup>
          <PasswordField
            name="currentPassword"
            label="Current Password"
            placeholder="Enter current password"
            startAdornment={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          />

          <PasswordField
            name="newPassword"
            label="New Password"
            placeholder="Enter new password"
            startAdornment={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            showStrengthIndicator
          />

          <PasswordField
            name="confirmNewPassword"
            label="Confirm New Password"
            placeholder="Confirm new password"
            startAdornment={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            showMatchIndicator
            matchPassword={newPassword}
          />

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <Typography variant="body2" className="font-medium">
                  Password Requirements
                </Typography>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          <Button type="submit" disabled={changePasswordMutation.isPending}>
            Update Password
          </Button>
        </FieldGroup>
      </Form>
    </SecurityTabCard>
  );
};
