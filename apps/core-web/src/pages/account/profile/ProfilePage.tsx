import { Alert } from '@vritti/quantum-ui';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import { AccountInformationCard } from '@/components/account/profile/AccountInformationCard';
import { PersonalInformationCard } from '@/components/account/profile/PersonalInformationCard';
import { useProfile } from '@/hooks/account/profile/useProfile';

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Typography variant="body1" intent="muted">
          Failed to load profile data
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="View your personal information and account details" />

      <Alert
        title="Profile Changes"
        description="To make changes to your profile information, please contact your administrator."
        variant="info"
      />

      <PersonalInformationCard profile={profile} />

      <AccountInformationCard profile={profile} />
    </div>
  );
};
