import { ORG_ORGANIZATION } from '@vritti/gitea-permissions/organization';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Building2 } from 'lucide-react';
import type React from 'react';
import { useCreateGiteaOrganization } from '@/hooks/organization/organization';

interface SetupOrganizationProps {
  namespace: string;
}

// Stands in for the details card until the namespace is provisioned. One action, no form: every field is
// derived server-side from the Vritti organization record, so the only input is the decision to create it.
export const SetupOrganization: React.FC<SetupOrganizationProps> = ({ namespace }) => {
  const setupMutation = useCreateGiteaOrganization();

  return (
    <Card>
      <CardContent className="py-6">
        <Empty
          icon={<Building2 />}
          iconColor="primary"
          title="No git organization yet"
          description={`Set up the "${namespace}" namespace to start hosting repositories. Its details are taken from your organization profile.`}
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
  );
};
