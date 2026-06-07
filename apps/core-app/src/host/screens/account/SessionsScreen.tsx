import { Button } from '@vritti/quantum-ui-native/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { useConfirm } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Skeleton } from '@vritti/quantum-ui-native/Skeleton';
import { Text } from '@vritti/quantum-ui-native/Text';
import { View } from 'react-native';
import { useRevokeAllSessions, useRevokeSession, useSessions } from '../../hooks/account';
import type { SessionData } from '../../services/account/security.service';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface SessionCardProps {
  session: SessionData;
  onRevoke?: () => void;
  isRevoking?: boolean;
}

const SessionCard = ({ session, onRevoke, isRevoking }: SessionCardProps) => (
  <View
    className={`rounded-xl border border-border p-4 gap-2 ${session.isCurrent ? 'bg-success/10 border-success/30' : ''}`}
  >
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-sm font-medium text-foreground">{session.device}</Text>
          {session.isCurrent && (
            <View className="rounded-full bg-success/20 px-2 py-0.5">
              <Text className="text-xs text-success font-medium">Current</Text>
            </View>
          )}
        </View>
        {session.ipAddress ? <Text className="text-xs text-muted-foreground">{session.ipAddress}</Text> : null}
        <Text className="text-xs text-muted-foreground">Last active: {formatRelativeTime(session.lastActive)}</Text>
      </View>
      {!session.isCurrent && onRevoke ? (
        <Button variant="ghost" onPress={onRevoke} disabled={isRevoking}>
          <Text className={`text-sm ${isRevoking ? 'text-muted-foreground' : 'text-destructive'}`}>
            {isRevoking ? '...' : 'Revoke'}
          </Text>
        </Button>
      ) : null}
    </View>
  </View>
);

export const SessionsScreen = () => {
  const { data: sessions, isLoading } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();
  const confirm = useConfirm();

  const currentSession = sessions?.find((s) => s.isCurrent);
  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];

  const handleRevokeSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Revoke Session',
      description: 'The device will be signed out immediately.',
      confirmLabel: 'Revoke',
      variant: 'destructive',
    });
    if (confirmed) {
      revokeSessionMutation.mutate(sessionId);
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = await confirm({
      title: 'Sign Out All Devices',
      description: 'All other devices will be signed out immediately. This session will remain active.',
      confirmLabel: 'Sign Out All',
      variant: 'destructive',
    });
    if (confirmed) {
      revokeAllMutation.mutate();
    }
  };

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <View className="gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>Devices currently signed in to your account.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {isLoading ? (
              <View className="gap-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </View>
            ) : (
              <>
                {currentSession && <SessionCard session={currentSession} />}

                {otherSessions.length > 0 ? (
                  <View className="gap-3">
                    {otherSessions.map((session) => (
                      <SessionCard
                        key={session.sessionId}
                        session={session}
                        onRevoke={() => handleRevokeSession(session.sessionId)}
                        isRevoking={
                          revokeSessionMutation.isPending && revokeSessionMutation.variables === session.sessionId
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm text-muted-foreground text-center py-2">No other active sessions</Text>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {!isLoading && otherSessions.length > 0 && (
          <Button
            variant="destructive"
            onPress={handleRevokeAll}
            isLoading={revokeAllMutation.isPending}
            loadingText="Signing out..."
          >
            <Text>Sign Out All Other Devices</Text>
          </Button>
        )}
      </View>
    </ScreenContainer>
  );
};
