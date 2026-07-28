import { ORG_ORGANISATION } from '@vritti/commerce-permissions/organisation';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// Shown when the git namespace has not been provisioned. Repositories live inside it, so there is
// nothing to list and no point offering a create action — the gateway rejects both anyway.
export const OrganisationRequired = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Both features are sibling catalog routes under the same workspace, so swapping the last segment
  // reaches the organisation screen. Coupled to the authored `organisation` routePrefix — a remote
  // cannot read the features payload to resolve it dynamically.
  const organisationPath = pathname.replace(/\/[^/]*\/?$/, '/organisation');

  return (
    <Card>
      <CardContent className="py-6">
        <Empty
          icon={<Building2 />}
          iconColor="warning"
          title="Set up your git organisation first"
          description="Repositories live inside your organisation's namespace on the git service. Once it exists you can create repositories here."
          action={
            <Button permission={ORG_ORGANISATION.view} onClick={() => navigate(organisationPath)}>
              Go to Organisation
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};
