import { Button } from '@vritti/quantum-ui-native/Button';
import { Card } from '@vritti/quantum-ui-native/Card';
import { useConfirm } from '@vritti/quantum-ui-native/hooks';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Skeleton } from '@vritti/quantum-ui-native/Skeleton';
import { Text } from '@vritti/quantum-ui-native/Text';
import { cn } from '@vritti/quantum-ui-native/utils';
import { useState } from 'react';
import { View } from 'react-native';
import { useRevokeAllSessions, useRevokeSession, useSessions } from '../../hooks/account';
import type { SessionData } from '../../types/account';

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
  <Card className={cn('gap-2 p-4', session.isCurrent && 'border-primary bg-primary/10')}>
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-sm font-medium text-foreground">{session.device}</Text>
          {session.isCurrent && (
            <View className="rounded-full bg-primary/20 px-2 py-0.5">
              <Text className="text-xs font-medium text-primary">Current</Text>
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
  </Card>
);

export const SessionsScreen = () => {
  const { data, loading: isLoading } = useSessions();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokeSession] = useRevokeSession();
  const [revokeAll, revokeAllResult] = useRevokeAllSessions();
  const confirm = useConfirm();

  const sessions = data?.sessions;
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
      setRevokingSessionId(sessionId);
      revokeSession({ variables: { sessionId } }).finally(() => setRevokingSessionId(null));
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
      void revokeAll();
    }
  };

  return (
    <ScreenContainer scrollable contentContainerClassName="gap-6 p-4 pb-8">
      <View className="gap-1.5">
        <Text className="text-2xl font-bold text-foreground">Active sessions</Text>
        <Text className="text-base text-muted-foreground">Devices currently signed in to your account.</Text>
      </View>

      {isLoading ? (
        <View className="gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </View>
      ) : (
        <View className="gap-3">
          {currentSession && <SessionCard session={currentSession} />}

          {otherSessions.length > 0 ? (
            otherSessions.map((session) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                onRevoke={() => handleRevokeSession(session.sessionId)}
                isRevoking={revokingSessionId === session.sessionId}
              />
            ))
          ) : (
            <Text className="py-2 text-center text-sm text-muted-foreground">No other active sessions</Text>
          )}
        </View>
      )}

      {!isLoading && otherSessions.length > 0 && (
        <Button
          variant="destructive"
          onPress={handleRevokeAll}
          isLoading={revokeAllResult.loading}
          loadingText="Signing out..."
        >
          <Text>Sign Out All Other Devices</Text>
        </Button>
      )}
    </ScreenContainer>
  );
};
