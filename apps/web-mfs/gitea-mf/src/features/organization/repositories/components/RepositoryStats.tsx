import { cn } from '@vritti/quantum-ui/cn';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { GitBranch, History, Tag } from 'lucide-react';
import type React from 'react';
import { useRepositoryStats } from '@/hooks/organization/repositories';

interface RepositoryStatsProps {
  repositoryName: string;
  // Commit counts are scoped to the selected ref, so the bar re-reads when the branch changes
  ref: string;
  className?: string;
}

// Display-only: there are no commit or tag screens to link to yet. Labels are singular — pluralize
// inflects them against the count rather than a second hand-written field.
const SEGMENTS = [
  { key: 'commits', icon: History, label: 'Commit' },
  { key: 'branches', icon: GitBranch, label: 'Branch' },
  { key: 'tags', icon: Tag, label: 'Tag' },
] as const;

export const RepositoryStats: React.FC<RepositoryStatsProps> = ({ repositoryName, ref, className }) => {
  const fmt = useFormatters();
  // Counts come from x-total-count headers, so this is cheap
  const { data: stats, isLoading } = useRepositoryStats(repositoryName, ref);

  return (
    // Standalone block, so it carries its own surface: it no longer sits flush inside a Card
    <div className={cn('grid grid-cols-3 divide-x divide-border rounded-xl border bg-card', className)}>
      {SEGMENTS.map(({ key, icon: Icon, label }) => {
        const count = stats?.[key];

        return (
          <div key={key} className="flex items-center justify-center gap-2 px-4 py-3 text-sm">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            {isLoading || count === undefined ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span>
                <span className="font-semibold">{fmt.number(count).primary}</span>{' '}
                <span className="text-muted-foreground">{pluralize(label, count)}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
