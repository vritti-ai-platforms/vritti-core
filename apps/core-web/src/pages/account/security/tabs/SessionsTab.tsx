import { SecurityTabCard } from '@components/account/security/SecurityTabCard';
import { useRevokeAllSessions, useRevokeSession, useSessions } from '@hooks/account/security';
import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { Separator } from '@vritti/quantum-ui/Separator';
import { Typography } from '@vritti/quantum-ui/Typography';
import { LogOut } from 'lucide-react';
import { SessionCard } from '../components/SessionCard';

export const SessionsTab: React.FC = () => {
  const { data: sessions, isLoading } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();
  const confirm = useConfirm();

  const currentSession = sessions?.find((s) => s.isCurrent);
  const otherSessions = sessions?.filter((s) => !s.isCurrent);

  const handleRevokeSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Revoke Session',
      description: 'Are you sure you want to revoke this session? The device will be signed out immediately.',
      confirmLabel: 'Revoke Session',
      variant: 'destructive',
    });
    if (confirmed) {
      revokeSessionMutation.mutate(sessionId);
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = await confirm({
      title: 'Sign Out All Devices',
      description:
        'Are you sure you want to sign out from all other devices? All other sessions will be terminated immediately.',
      confirmLabel: 'Sign Out All',
      variant: 'destructive',
    });
    if (confirmed) {
      revokeAllMutation.mutate();
    }
  };

  return (
    <SecurityTabCard
      title="Active Sessions"
      description="Manage devices where you're currently signed in"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {currentSession && <SessionCard session={currentSession} />}

        {otherSessions && otherSessions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              {otherSessions.map((session) => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  onRevoke={() => handleRevokeSession(session.sessionId)}
                  isRevoking={revokeSessionMutation.isPending}
                />
              ))}
            </div>
          </>
        )}

        {otherSessions && otherSessions.length === 0 && (
          <>
            <Separator />
            <div className="text-center py-6">
              <Typography variant="body2" intent="muted">
                No other active sessions
              </Typography>
            </div>
          </>
        )}

        {otherSessions && otherSessions.length > 0 && (
          <>
            <Separator />
            <Button
              type="button"
              variant="outline"
              onClick={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All Other Devices
            </Button>
          </>
        )}
      </div>
    </SecurityTabCard>
  );
};
