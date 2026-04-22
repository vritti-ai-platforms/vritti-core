import { Alert } from '@vritti/quantum-ui-native/Alert';
import { BasicCard } from '@vritti/quantum-ui-native/Card';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { ScrollView, View } from 'react-native';

export const AccountPasswordScreen = () => {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-4 pb-8">
      <Alert
        variant="warning"
        title="Coming soon"
        description="Password reset and password change flows will be added to the native account experience in a follow-up."
      />

      <View className="gap-3">
        <SectionHeader title="Password" />
        <BasicCard
          title="Password management"
          description="This screen is reserved for updating your password and handling recovery-related actions."
        >
          <View className="gap-3">
            <Text className="text-sm leading-6 text-muted-foreground">
              The web account area already supports password changes. This native screen is scaffolded now so the
              account navigation and overall UX can settle before the full form and validation flow are added.
            </Text>
            <Text className="text-sm leading-6 text-muted-foreground">
              Planned support includes current password verification, new password validation, and confirmation.
            </Text>
          </View>
        </BasicCard>
      </View>
    </ScrollView>
  );
};
