import { BasicCard } from '@vritti/quantum-ui-native/Card';
import { Alert } from '@vritti/quantum-ui-native/Alert';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { View } from 'react-native';

export const AccountSessionsScreen = () => {
  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <Alert
        variant="info"
        title="Session controls are scaffolded"
        description="Active session listing and revoke actions are planned for a follow-up native implementation."
      />

      <View className="gap-3">
        <SectionHeader title="Sessions" />
        <BasicCard
          title="Active sessions"
          description="This screen will eventually mirror the web security page for device and session management."
        >
          <View className="gap-3">
            <Text className="text-sm leading-6 text-muted-foreground">
              Future native support will show the current device, other signed-in sessions, and destructive session
              revoke actions.
            </Text>
            <Text className="text-sm leading-6 text-muted-foreground">
              The backend endpoints already exist, but this first pass keeps the route and UX scaffold only.
            </Text>
          </View>
        </BasicCard>
      </View>
    </ScreenContainer>
  );
};
