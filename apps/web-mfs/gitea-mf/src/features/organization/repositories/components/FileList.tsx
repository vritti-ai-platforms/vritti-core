import { Button } from '@vritti/quantum-ui/Button';
import { CornerLeftUp } from 'lucide-react';
import type React from 'react';
import type { RepositoryEntryData } from '@/schemas/repositories';
import { resolveFileIcon } from '../utils/file-icons';
import { formatEntrySize } from '../utils/format';

// Only a directory can be opened — there is no file viewer — so the callback takes the narrowed
// entry rather than any entry, making a file row impossible to wire to navigation.
type RepositoryDirectoryData = RepositoryEntryData & { entryType: 'dir' };

function isDirectory(entry: RepositoryEntryData): entry is RepositoryDirectoryData {
  return entry.entryType === 'dir';
}

interface FileListProps {
  entries: RepositoryEntryData[];
  // Set when the listing is below the repository root, so a parent row can be offered
  parentPath: string | null;
  onOpenDirectory: (entry: RepositoryDirectoryData) => void;
  onNavigateToParent: () => void;
}

// Shared by the header and every row so the three columns line up
const ROW_GRID = 'grid w-full grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]';

// Tailwind v4's button reset leaves the cursor as `default`, so interactive rows ask for it explicitly
const NAVIGABLE_ROW = 'h-auto w-full cursor-pointer justify-start rounded-none px-4 py-2.5';

export const FileList: React.FC<FileListProps> = ({ entries, parentPath, onOpenDirectory, onNavigateToParent }) => (
  // Frameless on purpose: the enclosing Card is the box, so rows sit flush against its edges rather
  // than inside a second nested border
  <div>
    <div className={`${ROW_GRID} border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground`}>
      <span>Name</span>
      <span className="hidden sm:block">Last commit</span>
      <span className="text-right">Size</span>
    </div>

    <div className="divide-y divide-border">
      {parentPath !== null && (
        <Button variant="ghost" className={`${NAVIGABLE_ROW} gap-2 font-mono text-sm`} onClick={onNavigateToParent}>
          <CornerLeftUp className="size-4 shrink-0 text-muted-foreground" />
          ..
        </Button>
      )}

      {entries.map((entry) => {
        const { Icon, className: iconClassName } = resolveFileIcon(entry.name, entry.entryType);

        const name = (
          <span className="flex min-w-0 items-center gap-2 font-mono text-sm">
            <Icon className={`size-4 shrink-0 ${iconClassName}`} />
            <span className="truncate">{entry.name}</span>
          </span>
        );

        const lastCommit = (
          <span className="hidden truncate text-left text-xs font-normal text-muted-foreground sm:block">
            {entry.lastCommitMessage}
          </span>
        );

        // Directories navigate; files, symlinks and submodules are read-only rows with nowhere to go
        if (isDirectory(entry)) {
          return (
            <Button key={entry.path} variant="ghost" className={NAVIGABLE_ROW} onClick={() => onOpenDirectory(entry)}>
              <div className={ROW_GRID}>
                {name}
                {lastCommit}
                <span className="text-right text-xs font-normal text-muted-foreground" />
              </div>
            </Button>
          );
        }

        return (
          <div key={entry.path} className={`${ROW_GRID} px-4 py-2.5`}>
            {name}
            {lastCommit}
            <span className="text-right text-xs font-normal text-muted-foreground">
              {entry.entryType === 'file' ? formatEntrySize(entry.size) : ''}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);
