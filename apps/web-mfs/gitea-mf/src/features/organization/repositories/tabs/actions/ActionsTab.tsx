import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Workflow } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useRepository } from '@/hooks/organization/repositories';
import { RunsTable } from './components/RunsTable';
import { WorkflowsPanel } from './components/WorkflowsPanel';

// Composes the two panels and nothing else — each fetches what it renders and reads the search params
// it needs, so no data or selection state passes through here
export const ActionsTab = () => {
  const { repoName = '' } = useParams<{ repoName: string }>();
  const { data: repository } = useRepository(repoName);

  if (repository.isEmpty) {
    return (
      <Card>
        <CardContent className="py-6">
          <Empty
            icon={<Workflow />}
            title="Nothing pushed yet"
            description="Workflows are YAML files under .gitea/workflows. Push a branch that contains one and its runs will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WorkflowsPanel repositoryName={repository.name} />
      <RunsTable repositoryName={repository.name} />
    </div>
  );
};
