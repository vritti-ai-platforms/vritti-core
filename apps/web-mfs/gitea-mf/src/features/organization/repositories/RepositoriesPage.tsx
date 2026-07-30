import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { useGiteaOrganization } from '@/hooks/organization/organization';
import { OrganizationRequired } from './components/OrganizationRequired';
import { RepositoriesTable } from './components/RepositoriesTable';

export const RepositoriesPage = () => {
  // Gate on the namespace before anything else — the list and create endpoints both reject when the
  // git organization has not been provisioned.
  const { data: status, isLoading } = useGiteaOrganization();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repositories" description="Git repositories inside your organization's namespace." />

      {/* The table owns its own loading skeleton, so the namespace check and the list read as one load
          rather than a bare block standing in for the page */}
      {status && !status.exists ? (
        <OrganizationRequired />
      ) : (
        <RepositoriesTable isOrganizationPending={isLoading || !status} />
      )}
    </div>
  );
};
