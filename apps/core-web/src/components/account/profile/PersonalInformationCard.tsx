import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { ProfileData } from '@/schemas/account';

interface PersonalInformationCardProps {
  profile: ProfileData;
}

export const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({ profile }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your personal details on file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Typography variant="body2" intent="muted" className="mb-1">
              Full Name
            </Typography>
            <Typography variant="body1">{profile.fullName}</Typography>
          </div>
          <div>
            <Typography variant="body2" intent="muted" className="mb-1">
              Display Name
            </Typography>
            <Typography variant="body1">{profile.displayName}</Typography>
          </div>
          <div>
            <Typography variant="body2" intent="muted" className="mb-1">
              Email
            </Typography>
            <Typography variant="body1">{profile.email}</Typography>
          </div>
          <div>
            <Typography variant="body2" intent="muted" className="mb-1">
              Locale
            </Typography>
            <Typography variant="body1">{profile.locale.toUpperCase()}</Typography>
          </div>
          <div>
            <Typography variant="body2" intent="muted" className="mb-1">
              Timezone
            </Typography>
            <Typography variant="body1">{profile.timezone}</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
