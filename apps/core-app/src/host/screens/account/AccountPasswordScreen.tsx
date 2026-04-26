import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { View } from 'react-native';

export const AccountPasswordScreen = () => {
  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <StaticAlert
        variant="warning"
        title="Coming soon"
        description="Password reset and password change flows will be added to the native account experience in a follow-up."
      />

      <View className="gap-3">
        <SectionHeader title="Password" />
        <Card>
          <CardHeader>
            <CardTitle>Password management</CardTitle>
            <CardDescription>
              This screen is reserved for updating your password and handling recovery-related actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <Text className="text-sm leading-6 text-muted-foreground">
                The web account area already supports password changes. This native screen is scaffolded now so the
                account navigation and overall UX can settle before the full form and validation flow are added.
              </Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                Planned support includes current password verification, new password validation, and confirmation.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScreenContainer>
  );
};
