import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { useGiteaOrganisation } from '@/hooks/organization/organisation';
import { OrganisationRequired } from './components/OrganisationRequired';
import { RepositoriesTable } from './components/RepositoriesTable';

export const RepositoriesPage = () => {
  // Gate on the namespace before anything else — the list and create endpoints both reject when the
  // git organisation has not been provisioned.
  const { data: status, isLoading } = useGiteaOrganisation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repositories" description="Git repositories inside your organisation's namespace." />

      {isLoading || !status ? (
        <Skeleton className="h-64 w-full" />
      ) : status.exists ? (
        <RepositoriesTable />
      ) : (
        <OrganisationRequired />
      )}
    </div>
  );
};
