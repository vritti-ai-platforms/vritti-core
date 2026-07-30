import { ORG_ORGANIZATION } from '@vritti/commerce-permissions/organization';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Building2 } from 'lucide-react';
import { useCreateGiteaOrganization, useGiteaOrganization } from '@/hooks/organization/organization';
import { OrganizationDetails } from './components/OrganizationDetails';
import { OrganizationDetailsSkeleton } from './components/OrganizationDetailsSkeleton';

export const OrganizationPage = () => {
  const { data: status, isLoading } = useGiteaOrganization();
  const setupMutation = useCreateGiteaOrganization();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Organization" description="Your organization's namespace on the git service." />

      {isLoading || !status ? (
        <OrganizationDetailsSkeleton />
      ) : status.exists && status.organization ? (
        <OrganizationDetails organization={status.organization} />
      ) : (
        // Not provisioned yet — one action, no form: every field is derived server-side from the
        // Vritti organization record.
        <Card>
          <CardContent className="py-6">
            <Empty
              icon={<Building2 />}
              iconColor="primary"
              title="No git organization yet"
              description={`Set up the "${status.namespace}" namespace to start hosting repositories. Its details are taken from your organization profile.`}
              action={
                <Button
                  permission={ORG_ORGANIZATION.setup}
                  onClick={() => setupMutation.mutate()}
                  isLoading={setupMutation.isPending}
                  loadingText="Setting up..."
                >
                  Setup organization
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
