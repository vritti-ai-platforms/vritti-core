import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Select } from '@vritti/quantum-ui/Select';
import { GitBranch } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRepositoryBranches } from '@/hooks/organization/repositories';
import type { RepositoryData } from '@/schemas/repositories';
import { FileList } from '../components/FileList';
import { PathCrumbs } from '../components/PathCrumbs';
import { RepositoryStats } from '../components/RepositoryStats';

// Above this many branches the popover gets a search box; below it, one would just be clutter
const SEARCHABLE_BRANCH_THRESHOLD = 10;

interface CodeTabProps {
  repository: RepositoryData;
}

export const CodeTab: React.FC<CodeTabProps> = ({ repository }) => {
  // Path and ref both live in search params so browser back walks the tree and links are shareable
  const [searchParams, setSearchParams] = useSearchParams();
  const path = searchParams.get('path') ?? '';
  const ref = searchParams.get('ref') || repository.defaultBranch;

  const { data: branches, isLoading: isLoadingBranches } = useRepositoryBranches(repository.name, {
    enabled: !repository.isEmpty,
  });

  // Gitea does not guarantee the default branch lands in the first page, and a value with no matching
  // option renders an empty trigger — so it is unioned in whenever the fetched list omits it.
  const branchOptions = useMemo(() => {
    const names = branches?.items ?? [];
    const withDefault = names.includes(ref) ? names : [ref, ...names];
    return withDefault.map((name) => ({ value: name, label: name }));
  }, [branches?.items, ref]);

  const navigateTo = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('path', next);
    else params.delete('path');
    setSearchParams(params);
  };

  // Returns to the root: a path valid on one branch is often absent on another, and the gateway
  // answers a missing path with an empty listing, which would read as a failure right after switching.
  const handleBranchChange = (next: string | number | boolean | null) => {
    if (typeof next !== 'string' || !next) return;

    const params = new URLSearchParams(searchParams);
    params.delete('path');
    if (next === repository.defaultBranch) params.delete('ref');
    else params.set('ref', next);
    setSearchParams(params);
  };

  if (repository.isEmpty) {
    return (
      <Card>
        <CardContent className="py-6">
          <Empty
            icon={<GitBranch />}
            title="Nothing pushed yet"
            description="This repository has no commits. Push your first branch and its files will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <RepositoryStats repositoryName={repository.name} ref={ref} />

      {/* Deliberately uncarded: the trail and the branch picker are controls for the listing below,
          not content of their own */}
      <div className="flex items-center justify-between gap-4">
        <PathCrumbs path={path} onNavigate={navigateTo} />

        {/* Width has to be set on a wrapper, not on Select: it renders its trigger inside a Field whose
            `[&>*]:w-full` overrides any width passed down, so the field would otherwise fill the row */}
        <div className="w-56 shrink-0">
          <Select
            options={branchOptions}
            value={ref}
            onChange={handleBranchChange}
            searchable={branchOptions.length > SEARCHABLE_BRANCH_THRESHOLD}
            searchPlaceholder="Search branches..."
            disabled={isLoadingBranches}
          />
        </div>
      </div>

      {/* FileList owns the listing query and its own loading and empty states */}
      <FileList repositoryName={repository.name} path={path} ref={ref} onNavigate={navigateTo} />
    </div>
  );
};
