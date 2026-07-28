import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import type React from 'react';
import type { RepositoryData } from '@/schemas/repositories';
import { CloneUrlField } from '../components/CloneUrlField';
import { PushInstructions } from '../components/PushInstructions';
import { formatRepositorySize } from '../utils/format';

interface OverviewTabProps {
  repository: RepositoryData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ repository }) => (
  <div className="flex flex-col gap-6">
    {/* Every repository is created without an initial commit, so this is the state a new one lands in */}
    {repository.isEmpty && <PushInstructions repository={repository} />}

    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <DetailField
          label="Visibility"
          type="string"
          value={<Badge variant="outline">{repository.isPrivate ? 'Private' : 'Public'}</Badge>}
        />
        <DetailField label="Default branch" type="string" value={repository.defaultBranch} mono />
        <DetailField label="Size" type="string" value={formatRepositorySize(repository.size)} />
        <DetailField label="Full name" type="string" value={repository.fullName} mono />
        <DetailField label="Created" type="dateTime" value={repository.createdAt} />
        <DetailField label="Last updated" type="dateTime" value={repository.updatedAt} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Clone</CardTitle>
        <CardDescription>Use these URLs to clone the repository or add it as a remote.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CloneUrlField label="HTTP" url={repository.cloneUrl} />
        <CloneUrlField label="SSH" url={repository.sshUrl} />
      </CardContent>
    </Card>
  </div>
);
