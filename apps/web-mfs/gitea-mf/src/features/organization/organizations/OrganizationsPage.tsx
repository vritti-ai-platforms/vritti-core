import { ORG_ORGANISATION } from '@vritti/commerce-permissions/organisation';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Building2 } from 'lucide-react';
import { useCreateGiteaOrganisation, useGiteaOrganisation } from '@/hooks/organization/organisation';
import { OrganisationDetails } from './components/OrganisationDetails';

export const OrganizationsPage = () => {
  const { data: status, isLoading } = useGiteaOrganisation();
  const setupMutation = useCreateGiteaOrganisation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Organisation" description="Your organization's namespace on the git service." />

      {isLoading || !status ? (
        <Skeleton className="h-64 w-full" />
      ) : status.exists && status.organization ? (
        <OrganisationDetails organisation={status.organization} />
      ) : (
        // Not provisioned yet — one action, no form: every field is derived server-side from the
        // Vritti organization record.
        <Card>
          <CardContent className="py-6">
            <Empty
              icon={<Building2 />}
              iconColor="primary"
              title="No git organisation yet"
              description={`Set up the "${status.namespace}" namespace to start hosting repositories. Its details are taken from your organization profile.`}
              action={
                <Button
                  permission={ORG_ORGANISATION.setup}
                  onClick={() => setupMutation.mutate()}
                  isLoading={setupMutation.isPending}
                  loadingText="Setting up..."
                >
                  Setup organisation
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
