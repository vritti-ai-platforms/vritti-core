import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { cn } from '@vritti/quantum-ui/cn';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Play, Power, PowerOff, Workflow } from 'lucide-react';
import type React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDisableWorkflow, useEnableWorkflow, useWorkflows } from '@/hooks/organization/actions';
import type { WorkflowData } from '@/schemas/actions';
import { DispatchWorkflowDialog } from '../forms/DispatchWorkflowDialog';
import { WorkflowsPanelSkeleton } from './WorkflowsPanelSkeleton';

// Tailwind v4's button reset leaves the cursor as `default`, so interactive rows ask for it explicitly
const NAVIGABLE_ROW = 'h-auto min-w-0 flex-1 cursor-pointer justify-start rounded-none px-4 py-2.5';

interface WorkflowRowProps {
  repositoryName: string;
  workflow: WorkflowData;
  isSelected: boolean;
  onSelect: (workflowId: string) => void;
}

const WorkflowRow: React.FC<WorkflowRowProps> = ({ repositoryName, workflow, isSelected, onSelect }) => {
  const dispatchDialog = useDialog();
  const enableMutation = useEnableWorkflow(repositoryName);
  const disableMutation = useDisableWorkflow(repositoryName);

  // The two endpoints are separate hooks, but a row only ever needs the one its current state allows
  const toggleMutation = workflow.isActive ? disableMutation : enableMutation;

  return (
    <div className={cn('flex items-center gap-1 pr-2', isSelected && 'bg-muted')}>
      <Button variant="ghost" className={NAVIGABLE_ROW} onClick={() => onSelect(workflow.id)}>
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Workflow className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{workflow.name}</span>
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono text-xs font-normal text-muted-foreground">{workflow.path}</span>
            {!workflow.isActive && <Badge variant="outline">Disabled</Badge>}
          </span>
        </span>
      </Button>

      <Dialog
        handle={dispatchDialog}
        icon={Play}
        title={`Run ${workflow.name}`}
        description="Queues a run of this workflow against the ref you pick."
        anchor={(open) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Run ${workflow.name}`}
            permission={ORG_REPOSITORIES.actions.workflows.dispatch}
            disabled={!workflow.isActive}
            disabledTip="Enable this workflow before running it"
            onClick={open}
          >
            <Play className="size-4" />
          </Button>
        )}
        content={(close) => (
          <DispatchWorkflowDialog
            repositoryName={repositoryName}
            workflowId={workflow.id}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Button
        variant="ghost"
        size="icon"
        aria-label={workflow.isActive ? `Disable ${workflow.name}` : `Enable ${workflow.name}`}
        permission={ORG_REPOSITORIES.actions.workflows.configure}
        disabled={toggleMutation.isPending}
        onClick={() => toggleMutation.mutate(workflow.id)}
      >
        {workflow.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
      </Button>
    </div>
  );
};

interface WorkflowsPanelProps {
  repositoryName: string;
  className?: string;
}

export const WorkflowsPanel: React.FC<WorkflowsPanelProps> = ({ repositoryName, className }) => {
  const { data: workflows, isLoading } = useWorkflows(repositoryName);

  // The filter is URL state, so this panel and the runs table both read it rather than one telling the other
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedWorkflowId = searchParams.get('workflow') ?? '';

  // Picking the selected workflow again clears the filter
  const onSelectWorkflow = (next: string) => {
    const params = new URLSearchParams(searchParams);
    const value = next === selectedWorkflowId ? '' : next;
    if (value) params.set('workflow', value);
    else params.delete('workflow');
    setSearchParams(params);
  };

  return (
    // py-0 so the rows reach the card's edges; the placeholder states supply their own padding
    <Card className={cn('overflow-hidden py-0', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span>Workflows</span>
        {selectedWorkflowId && (
          <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onSelectWorkflow('')}>
            Show all runs
          </Button>
        )}
      </div>

      {isLoading || !workflows ? (
        <WorkflowsPanelSkeleton />
      ) : workflows.items.length === 0 ? (
        <Empty
          icon={<Workflow />}
          title="No workflows"
          description="Workflows are YAML files under .gitea/workflows. Push one and it appears here."
        />
      ) : (
        <div className="divide-y divide-border">
          {workflows.items.map((workflow) => (
            <WorkflowRow
              key={workflow.id}
              repositoryName={repositoryName}
              workflow={workflow}
              isSelected={workflow.id === selectedWorkflowId}
              onSelect={onSelectWorkflow}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
