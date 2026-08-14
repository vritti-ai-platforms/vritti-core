import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatchWorkflow } from '@/hooks/organization/actions';
import { useRepository, useRepositoryBranches } from '@/hooks/organization/repositories';
import { type DispatchWorkflowFormData, dispatchWorkflowSchema } from '@/schemas/actions';
import { describeDispatchError } from '../utils/actions';

// Above this many branches the popover gets a search box; below it, one would just be clutter
const SEARCHABLE_BRANCH_THRESHOLD = 10;

interface DispatchWorkflowDialogProps {
  repositoryName: string;
  workflowId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DispatchWorkflowDialog: React.FC<DispatchWorkflowDialogProps> = ({
  repositoryName,
  workflowId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  // Both reads are already in cache from the page above, so owning them here costs no extra request
  const { data: repository } = useRepository(repositoryName);
  const { data: branches, isLoading: isLoadingBranches } = useRepositoryBranches(repositoryName);
  const defaultRef = repository.defaultBranch;

  const form = useForm<DispatchWorkflowFormData>({
    resolver: zodResolver(dispatchWorkflowSchema),
    defaultValues: { ref: defaultRef },
  });

  // A dispatch answers with the run it queued, so the user lands straight on it. This dialog renders
  // under `<repository>/actions`, so the id alone resolves to that run's page.
  const dispatchMutation = useDispatchWorkflow(repositoryName, workflowId, {
    onSuccess: (run) => {
      onSuccess();
      if (run) navigate(String(run.id), { relative: 'path' });
    },
  });

  // Gitea does not guarantee the default branch lands in the first page, and a value with no matching
  // option renders an empty trigger — so it is unioned in whenever the fetched list omits it
  const refOptions = useMemo(() => {
    const names = branches?.items ?? [];
    const withDefault = names.includes(defaultRef) ? names : [defaultRef, ...names];
    return withDefault.map((name) => ({ value: name, label: name }));
  }, [branches?.items, defaultRef]);

  // The rejection is swallowed instead of being handed to Form's root-error mapping: nothing the user
  // picked is wrong, so it is explained as guidance below rather than echoed as a validation failure.
  const handleSubmit = (data: DispatchWorkflowFormData) =>
    dispatchMutation.mutateAsync({ ref: data.ref }).catch(() => undefined);

  return (
    <Form form={form} onSubmit={handleSubmit} onCancel={onCancel} resetOnSuccess={false}>
      <div className="flex flex-col gap-4">
        {dispatchMutation.isError && (
          <Alert
            variant="destructive"
            title="The git service refused to start this workflow"
            description={describeDispatchError(dispatchMutation.error)}
          />
        )}

        {/* Width has to be set on a wrapper, not on Select: it renders its trigger inside a Field whose
            `[&>*]:w-full` overrides any width passed down, so the field would otherwise fill the row */}
        <div className="w-56 shrink-0">
          <Select
            name="ref"
            label="Run against"
            options={refOptions}
            searchable={refOptions.length > SEARCHABLE_BRANCH_THRESHOLD}
            searchPlaceholder="Search branches..."
            disabled={isLoadingBranches}
          />
        </div>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Starting...">
          Run workflow
        </Button>
      </DialogActions>
    </Form>
  );
};
