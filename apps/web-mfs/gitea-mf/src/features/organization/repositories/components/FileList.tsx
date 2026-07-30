import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { Empty } from '@vritti/quantum-ui/Empty';
import { CornerLeftUp, FileX } from 'lucide-react';
import type React from 'react';
import { useRepositoryContents } from '@/hooks/organization/repositories';
import type { RepositoryEntryData } from '@/schemas/repositories';
import { resolveFileIcon } from '../utils/file-icons';
import { formatEntrySize, parentPath as toParentPath } from '../utils/format';

// Only a directory can be opened — there is no file viewer — so the callback takes the narrowed
// entry rather than any entry, making a file row impossible to wire to navigation.
type RepositoryDirectoryData = RepositoryEntryData & { entryType: 'dir' };

function isDirectory(entry: RepositoryEntryData): entry is RepositoryDirectoryData {
  return entry.entryType === 'dir';
}

interface FileListProps {
  repositoryName: string;
  // Repository-relative; empty means the root
  path: string;
  ref: string;
  onNavigate: (path: string) => void;
}

// Shared by the header and every row so the three columns line up
const ROW_GRID = 'grid w-full grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]';

// Tailwind v4's button reset leaves the cursor as `default`, so interactive rows ask for it explicitly
const NAVIGABLE_ROW = 'h-auto w-full cursor-pointer justify-start rounded-none px-4 py-2.5';

// Owns the listing query and every state it can be in — loading, empty and populated — so the tab above
// only has to say which path to show. py-0 lets the rows reach the card's edges.
export const FileList: React.FC<FileListProps> = ({ repositoryName, path, ref, onNavigate }) => {
  const { data: contents, isLoading } = useRepositoryContents(repositoryName, { path, ref });

  if (isLoading || !contents) {
    return (
      <Card className="overflow-hidden py-0">
        {/* Mirrors the real listing: three columns under a header strip, unbordered so the Card is the box */}
        <CompactTableSkeleton
          className="rounded-none border-0"
          rows={8}
          columns={[
            { headerWidth: 'w-12', cellWidth: 'w-44' },
            { headerWidth: 'w-20', cellWidth: 'w-56' },
            { headerWidth: 'w-8', cellWidth: 'w-14' },
          ]}
        />
      </Card>
    );
  }

  if (contents.entries.length === 0) {
    return (
      <Card className="overflow-hidden py-0">
        <Empty icon={<FileX />} title="Nothing here" description={`This path has no files on ${ref}.`} />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className={`${ROW_GRID} border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground`}>
        <span>Name</span>
        <span className="hidden sm:block">Last commit</span>
        <span className="text-right">Size</span>
      </div>

      <div className="divide-y divide-border">
        {path !== '' && (
          <Button
            variant="ghost"
            className={`${NAVIGABLE_ROW} gap-2 font-mono text-sm`}
            onClick={() => onNavigate(toParentPath(path))}
          >
            <CornerLeftUp className="size-4 shrink-0 text-muted-foreground" />
            ..
          </Button>
        )}

        {contents.entries.map((entry) => {
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
              <Button key={entry.path} variant="ghost" className={NAVIGABLE_ROW} onClick={() => onNavigate(entry.path)}>
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
    </Card>
  );
};
