import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { KeyValue } from '@vritti/quantum-ui-native/Label';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Skeleton } from '@vritti/quantum-ui-native/Skeleton';
import { View } from 'react-native';
import { useProfile } from '../../hooks/account';
import { useAuth } from '../../providers/AuthProvider';
import { formatDateTime } from './utils';

export const ProfileScreen = () => {
  const { org } = useAuth();
  const { data, loading } = useProfile();
  const profile = data?.profile;

  const createdAt = formatDateTime(profile?.createdAt);
  const lastLoginAt = formatDateTime(profile?.lastLoginAt);

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>Personal</CardTitle>
          <CardDescription>Current information from your signed-in session.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <View className="gap-4">
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
            </View>
          ) : (
            <View className="gap-4">
              {profile?.fullName ? <KeyValue label="Full name" value={profile.fullName} /> : null}
              {profile?.email ? <KeyValue label="Email" value={profile.email} /> : null}
              {profile?.status ? <KeyValue label="Status" value={profile.status} /> : null}
            </View>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Organization context and recent sign-in activity for this session.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <View className="gap-4">
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-2/3 rounded-md" />
            </View>
          ) : (
            <View className="gap-4">
              {org?.name ? <KeyValue label="Organization" value={org.name} /> : null}
              {org?.subdomain ? <KeyValue label="Subdomain" value={org.subdomain} /> : null}
              {createdAt ? <KeyValue label="Account created" value={createdAt} /> : null}
              {lastLoginAt ? <KeyValue label="Last login" value={lastLoginAt} /> : null}
              {profile?.hasPassword != null ? (
                <KeyValue label="Password login" value={profile.hasPassword ? 'Enabled' : 'Not configured'} />
              ) : null}
            </View>
          )}
        </CardContent>
      </Card>
    </ScreenContainer>
  );
};
