import { BasicCard } from '@vritti/quantum-ui-native/Card';
import { KeyValue, SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ScrollView, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { formatDateTime } from './utils';

export const AccountProfileScreen = () => {
  const { user, org, sessionId } = useAuth();

  const createdAt = formatDateTime(user?.createdAt);
  const lastLoginAt = formatDateTime(user?.lastLoginAt);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-8"
    >
      <View className="gap-3">
        <SectionHeader title="Personal" />
        <BasicCard title="User details" description="Current information from your signed-in session.">
          <View className="gap-4">
            {user?.fullName ? <KeyValue label="Full name" value={user.fullName} /> : null}
            {user?.email ? <KeyValue label="Email" value={user.email} /> : null}
            {user?.status ? <KeyValue label="Status" value={user.status} /> : null}
          </View>
        </BasicCard>
      </View>

      <View className="gap-3">
        <SectionHeader title="Workspace" />
        <BasicCard title="Organization" description="Workspace context attached to the current session.">
          <View className="gap-4">
            {org?.name ? <KeyValue label="Organization" value={org.name} /> : null}
            {org?.subdomain ? <KeyValue label="Subdomain" value={org.subdomain} /> : null}
            {sessionId ? <KeyValue label="Session ID" value={sessionId} /> : null}
          </View>
        </BasicCard>
      </View>

      <View className="gap-3">
        <SectionHeader title="Activity" />
        <BasicCard title="Sign-in history" description="Available metadata from the current auth status snapshot.">
          <View className="gap-4">
            {createdAt ? <KeyValue label="Account created" value={createdAt} /> : null}
            {lastLoginAt ? <KeyValue label="Last login" value={lastLoginAt} /> : null}
            {user?.hasPassword != null ? (
              <KeyValue label="Password login" value={user.hasPassword ? 'Enabled' : 'Not configured'} />
            ) : null}
          </View>
        </BasicCard>
      </View>
    </ScrollView>
  );
};
