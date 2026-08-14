import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeleteRepository, useRepository } from '@/hooks/organization/repositories';
import { ActionsTab } from './tabs/actions/ActionsTab';
import { CodeTab } from './tabs/code/CodeTab';
import { OverviewTab } from './tabs/overview/OverviewTab';

export const RepositoryDetailPage = () => {
  // Repositories are keyed by name, not a name-uuid slug, so useSlugParams does not apply here
  const { repoName = '' } = useParams<{ repoName: string }>();
  const navigate = useNavigate();
  const { data: repository } = useRepository(repoName);
  const confirm = useConfirm();
  // Two segments up: the active tab is part of the path, so `..` alone would only land back here
  const deleteMutation = useDeleteRepository({ onSuccess: () => navigate('../..', { relative: 'path' }) });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${repository.name}"?`,
      description: 'This permanently deletes the repository and its full history. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(repository.name);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={repository.name} description={repository.description || 'No description'} />

      <Tabs
        // The tab is a path segment, not a search param: Breadcrumb links carry the pathname only, so a
        // `?tab=` would be dropped the moment a crumb is clicked
        routeParam="repoTab"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: ORG_REPOSITORIES.view,
            content: <OverviewTab repository={repository} />,
          },
          {
            value: 'code',
            label: 'Code',
            permission: ORG_REPOSITORIES.code.view,
            content: <CodeTab repository={repository} />,
          },
          {
            value: 'actions',
            label: 'Actions',
            permission: ORG_REPOSITORIES.actions.view,
            content: <ActionsTab />,
          },
        ]}
      />

      <DangerZone
        title="Delete this repository"
        description="This action cannot be undone. The repository and its full commit history will be permanently removed from the git service."
        buttonText="Delete Repository"
        permission={ORG_REPOSITORIES.delete}
        onClick={handleDelete}
      />
    </div>
  );
};
