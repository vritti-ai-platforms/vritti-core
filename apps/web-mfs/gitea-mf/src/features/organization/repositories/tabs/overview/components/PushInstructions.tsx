import { Alert } from '@vritti/quantum-ui/Alert';
import type React from 'react';
import type { RepositoryData } from '@/schemas/repositories';

interface PushInstructionsProps {
  repository: RepositoryData;
}

// Repositories are created without an initial commit so that pushing an existing project does not
// collide with unrelated history. That leaves a new repository with no branches, so it needs the
// first-push sequence spelled out.
export const PushInstructions: React.FC<PushInstructionsProps> = ({ repository }) => (
  <Alert
    variant="info"
    title="This repository is empty"
    description={
      <div className="flex flex-col gap-3">
        <span>Push an existing project to it, or clone it and make the first commit.</span>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
          {`git remote add origin ${repository.cloneUrl}
git branch -M ${repository.defaultBranch}
git push -u origin ${repository.defaultBranch}`}
        </pre>
      </div>
    }
  />
);
