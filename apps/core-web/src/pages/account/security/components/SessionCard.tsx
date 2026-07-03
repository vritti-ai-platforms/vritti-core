import type { SessionData } from '@services/account/security.service';
import { getRelativeTime } from '@utils/getRelativeTime';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Typography } from '@vritti/quantum-ui/Typography';
import { CheckCircle, LogOut, Monitor } from 'lucide-react';

interface SessionCardProps {
  session: SessionData;
  onRevoke?: () => void;
  isRevoking?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onRevoke, isRevoking }) => (
  <div className={`border border-border rounded-lg p-4 ${session.isCurrent ? 'bg-success/5' : ''}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="shrink-0 mt-1">
          <Monitor className={`h-5 w-5 ${session.isCurrent ? 'text-success' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Typography variant="body1" className="font-medium">
              {session.device}
            </Typography>
            {session.isCurrent && (
              <Badge variant="default">
                <CheckCircle className="h-3 w-3" />
                Current Session
              </Badge>
            )}
          </div>
          {session.ipAddress && (
            <Typography variant="body2" intent="muted">
              {session.ipAddress}
            </Typography>
          )}
          <Typography variant="body2" intent="muted" className="text-xs">
            Last active: {getRelativeTime(session.lastActive)}
          </Typography>
        </div>
      </div>
      {!session.isCurrent && onRevoke && (
        <Button type="button" variant="ghost" size="sm" onClick={onRevoke} disabled={isRevoking}>
          <LogOut className="h-4 w-4 mr-2" />
          Revoke
        </Button>
      )}
    </div>
  </div>
);
