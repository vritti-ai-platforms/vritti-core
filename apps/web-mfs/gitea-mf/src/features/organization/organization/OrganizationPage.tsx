import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { useGiteaOrganization } from '@/hooks/organization/organization';
import { OrganizationDetails } from './components/OrganizationDetails';
import { SetupOrganization } from './components/SetupOrganization';

export const OrganizationPage = () => {
  const { data: orgStatus } = useGiteaOrganization();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Organization" description="Your organization's namespace on the git service." />

      {orgStatus.organization ? (
        <OrganizationDetails organization={orgStatus.organization} />
      ) : (
        <SetupOrganization namespace={orgStatus.namespace} />
      )}
    </div>
  );
};
