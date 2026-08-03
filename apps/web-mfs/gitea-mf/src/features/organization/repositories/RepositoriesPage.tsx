import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { RepositoriesTable } from './components/RepositoriesTable';

// No namespace check here: a feature requiring the GITEA service is locked at its route, so this page
// does not mount until the org is provisioned
export const RepositoriesPage = () => (
  <div className="flex flex-col gap-6">
    <PageHeader title="Repositories" description="Git repositories inside your organization's namespace." />
    <RepositoriesTable />
  </div>
);
