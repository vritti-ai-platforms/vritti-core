import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { ProfileData } from '@/schemas/account';
import { AccountStatus } from '@/schemas/account';

// Maps account status to badge variant
function getStatusBadgeVariant(status: AccountStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case AccountStatus.ACTIVE:
      return 'default';
    case AccountStatus.PENDING:
      return 'secondary';
    case AccountStatus.SUSPENDED:
      return 'destructive';
    default:
      return 'outline';
  }
}

// Formats ISO date string to readable date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Formats ISO date string to readable date-time, or "Never" if null
function formatDateTime(dateString: string | null) {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface AccountInformationCardProps {
  profile: ProfileData;
}

export const AccountInformationCard: React.FC<AccountInformationCardProps> = ({ profile }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>View your account details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="body2" intent="muted" className="mb-1">
                User ID
              </Typography>
              <Typography variant="body1" className="font-mono text-sm">
                {profile.id}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" intent="muted" className="mb-1">
                Account Status
              </Typography>
              <Badge variant={getStatusBadgeVariant(profile.status)}>{profile.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="body2" intent="muted" className="mb-1">
                Account Created
              </Typography>
              <Typography variant="body1">{formatDate(profile.createdAt)}</Typography>
            </div>
            <div>
              <Typography variant="body2" intent="muted" className="mb-1">
                Last Login
              </Typography>
              <Typography variant="body1">{formatDateTime(profile.lastLoginAt)}</Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
