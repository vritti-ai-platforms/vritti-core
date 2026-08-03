import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { RepositorySelector } from '@vritti/quantum-ui/selects/repository';
import { ChevronsUpDown, FolderGit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RepositorySwitcherProps {
  // Repositories are keyed by name, so the raw breadcrumb segment is both the value and the fallback label
  repoName: string;
  // The repositories root, e.g. `/<workspaceSlug>/repositories`
  basePath: string;
}

// Renders the repository switcher dropdown in the top bar breadcrumb
export const RepositorySwitcher = ({ repoName, basePath }: RepositorySwitcherProps) => {
  const navigate = useNavigate();

  return (
    <RepositorySelector
      value={repoName}
      // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
      label={undefined}
      searchPlaceholder="Find repository..."
      contentClassName="w-60"
      anchor={({ selectedOption }) => (
        <Button
          startAdornment={<FolderGit2 className="size-4 text-muted-foreground" />}
          variant="ghost"
          className="h-auto min-w-25 p-0 gap-1.5 text-sm font-normal hover:bg-transparent"
        >
          <span className="flex-1 text-left font-normal text-foreground">{selectedOption?.label ?? repoName}</span>
          <span className="flex items-center justify-center size-6 rounded-full border border-border hover:bg-accent transition-colors">
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </span>
        </Button>
      )}
      footer={
        <>
          <Separator />
          <div className="p-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto px-2 py-1.5 text-sm font-normal"
              onClick={() => navigate(basePath)}
            >
              All Repositories
            </Button>
          </div>
        </>
      }
      onOptionSelect={(option) => {
        // Skip the on-mount initial-resolve fire (same repository) — only navigate on a real switch
        if (option && String(option.value) !== repoName) {
          // The tab resets rather than carrying over: a tab that suits one repository (an empty one has
          // no code or runs) need not suit the next
          navigate(`${basePath}/${option.value}/overview`);
        }
      }}
    />
  );
};
