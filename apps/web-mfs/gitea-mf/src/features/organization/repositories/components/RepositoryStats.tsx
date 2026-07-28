import { cn } from '@vritti/quantum-ui/cn';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { GitBranch, History, Tag } from 'lucide-react';
import type React from 'react';
import type { RepositoryStatsData } from '@/schemas/repositories';

interface RepositoryStatsProps {
  stats: RepositoryStatsData | undefined;
  isLoading: boolean;
  className?: string;
}

// Display-only: there are no commit or tag screens to link to yet
const SEGMENTS = [
  { key: 'commits', icon: History, label: 'Commit', plural: 'Commits' },
  { key: 'branches', icon: GitBranch, label: 'Branch', plural: 'Branches' },
  { key: 'tags', icon: Tag, label: 'Tag', plural: 'Tags' },
] as const;

export const RepositoryStats: React.FC<RepositoryStatsProps> = ({ stats, isLoading, className }) => (
  // Standalone block, so it carries its own surface: it no longer sits flush inside a Card
  <div className={cn('grid grid-cols-3 divide-x divide-border rounded-xl border bg-card', className)}>
    {SEGMENTS.map(({ key, icon: Icon, label, plural }) => {
      const count = stats?.[key];

      return (
        <div key={key} className="flex items-center justify-center gap-2 px-4 py-3 text-sm">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          {isLoading || count === undefined ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span>
              <span className="font-semibold">{count.toLocaleString()}</span>{' '}
              <span className="text-muted-foreground">{count === 1 ? label : plural}</span>
            </span>
          )}
        </div>
      );
    })}
  </div>
);
