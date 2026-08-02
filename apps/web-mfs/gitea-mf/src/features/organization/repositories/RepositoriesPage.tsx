import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { RepositoriesTable } from './components/RepositoriesTable';

export const RepositoriesPage = () => (
  // No namespace check here — a feature requiring the GITEA service is locked at its route, so the host
  // renders the setup screen and this page never mounts until the org is provisioned.
  <div className="flex flex-col gap-6">
    <PageHeader title="Repositories" description="Git repositories inside your organization's namespace." />
    <RepositoriesTable />
  </div>
);
