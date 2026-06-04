import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { KeyValue, SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { formatDateTime } from './utils';

export const ProfileScreen = () => {
  const { user, org, sessionId } = useAuth();

  const createdAt = formatDateTime(user?.createdAt);
  const lastLoginAt = formatDateTime(user?.lastLoginAt);

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <View className="gap-3">
        <SectionHeader title="Personal" />
        <Card>
          <CardHeader>
            <CardTitle>User details</CardTitle>
            <CardDescription>Current information from your signed-in session.</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="gap-4">
              {user?.fullName ? <KeyValue label="Full name" value={user.fullName} /> : null}
              {user?.email ? <KeyValue label="Email" value={user.email} /> : null}
              {user?.status ? <KeyValue label="Status" value={user.status} /> : null}
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title="Workspace" />
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Workspace context attached to the current session.</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="gap-4">
              {org?.name ? <KeyValue label="Organization" value={org.name} /> : null}
              {org?.subdomain ? <KeyValue label="Subdomain" value={org.subdomain} /> : null}
              {sessionId ? <KeyValue label="Session ID" value={sessionId} /> : null}
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="gap-3">
        <SectionHeader title="Activity" />
        <Card>
          <CardHeader>
            <CardTitle>Sign-in history</CardTitle>
            <CardDescription>Available metadata from the current auth status snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="gap-4">
              {createdAt ? <KeyValue label="Account created" value={createdAt} /> : null}
              {lastLoginAt ? <KeyValue label="Last login" value={lastLoginAt} /> : null}
              {user?.hasPassword != null ? (
                <KeyValue label="Password login" value={user.hasPassword ? 'Enabled' : 'Not configured'} />
              ) : null}
            </View>
          </CardContent>
        </Card>
      </View>
    </ScreenContainer>
  );
};
