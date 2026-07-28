import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeleteRepository, useRepository } from '@/hooks/organization/repositories';
import { CodeTab } from './tabs/CodeTab';
import { OverviewTab } from './tabs/OverviewTab';

export const RepositoryDetailPage = () => {
  // Repositories are keyed by name, not a name-uuid slug, so useSlugParams does not apply here
  const { repoName = '' } = useParams<{ repoName: string }>();
  const navigate = useNavigate();
  const { data: repository } = useRepository(repoName);
  const [activeTab, setActiveTab] = useState('overview');
  const confirm = useConfirm();
  const deleteMutation = useDeleteRepository({ onSuccess: () => navigate('..') });

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
            permission: ORG_REPOSITORIES.view,
            content: <CodeTab repository={repository} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
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
