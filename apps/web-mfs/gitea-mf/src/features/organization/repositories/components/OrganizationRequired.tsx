import { ORG_ORGANIZATION } from '@vritti/commerce-permissions/organization';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// Shown when the git namespace has not been provisioned. Repositories live inside it, so there is
// nothing to list and no point offering a create action — the gateway rejects both anyway.
export const OrganizationRequired = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Both features are sibling catalog routes under the same workspace, so swapping the last segment
  // reaches the organization screen. Coupled to the authored `organization` routePrefix — a remote
  // cannot read the features payload to resolve it dynamically.
  const organizationPath = pathname.replace(/\/[^/]*\/?$/, '/organization');

  return (
    <Card>
      <CardContent className="py-6">
        <Empty
          icon={<Building2 />}
          iconColor="warning"
          title="Set up your git organization first"
          description="Repositories live inside your organization's namespace on the git service. Once it exists you can create repositories here."
          action={
            <Button permission={ORG_ORGANIZATION.view} onClick={() => navigate(organizationPath)}>
              Go to Organization
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};
