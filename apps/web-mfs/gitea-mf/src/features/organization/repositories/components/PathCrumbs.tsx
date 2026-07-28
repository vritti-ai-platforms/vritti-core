import { Button } from '@vritti/quantum-ui/Button';
import { ChevronRight, FolderRoot } from 'lucide-react';
import type React from 'react';
import { toPathCrumbs } from '../utils/format';

interface PathCrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

// The trail through the repository tree. The repository name is deliberately absent — the PageHeader
// directly above already shows it — so the root is an icon instead.
// Also not quantum-ui's Breadcrumb, which derives its segments from the URL pathname: that would show
// the route rather than the path inside the repository.
export const PathCrumbs: React.FC<PathCrumbsProps> = ({ path, onNavigate }) => {
  const crumbs = toPathCrumbs(path);
  const atRoot = crumbs.length === 0;

  // Single line, truncating. Wrapping let a deep path stack onto two rows and shove the branch picker
  // about; flex-1 with min-w-0 makes the trail give up width instead of growing the row.
  return (
    <nav aria-label="Repository path" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden text-sm">
      {/* The current location is plain and full strength; a disabled Button would render it at
          disabled:opacity-50, fading the one segment that matters most */}
      {atRoot ? (
        <span className="flex size-7 shrink-0 items-center justify-center text-foreground">
          <FolderRoot className="size-4" />
        </span>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 cursor-pointer text-foreground"
          aria-label="Repository root"
          onClick={() => onNavigate('')}
        >
          <FolderRoot className="size-4" />
        </Button>
      )}

      {crumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex min-w-0 items-center gap-0.5">
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          {index === crumbs.length - 1 ? (
            <span className="truncate px-1 font-mono font-medium text-foreground">{crumb.name}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto min-w-0 cursor-pointer px-1 font-mono text-foreground"
              onClick={() => onNavigate(crumb.path)}
            >
              <span className="truncate">{crumb.name}</span>
            </Button>
          )}
        </span>
      ))}
    </nav>
  );
};
