import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DetailHeader } from '@vritti/quantum-ui/DetailField';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Layers, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import type { ModifierGroupDetail } from '@/schemas/modifiers';
import type { ModifierOptionData } from '@/schemas/offerings';
import { useModifierGroup } from '@/site/hooks/modifiers';
import { ModifierOptionsTable } from './ModifierOptionsTable';

interface ModifierGroupDetailPanelProps {
  catalogId: string;
  groupId: string | null;
  onEditGroup: (group: ModifierGroupDetail) => void;
  onDeleteGroup: (group: ModifierGroupDetail) => void;
  onAddOption: () => void;
  onEditOption: (option: ModifierOptionData) => void;
  onDeleteOption: (option: ModifierOptionData) => void;
}

export const ModifierGroupDetailPanel: React.FC<ModifierGroupDetailPanelProps> = ({
  catalogId,
  groupId,
  onEditGroup,
  onDeleteGroup,
  onAddOption,
  onEditOption,
  onDeleteOption,
}) => {
  const { data: group, isLoading } = useModifierGroup(catalogId, groupId);

  return (
    <PageContentDetails
      className="flex flex-col"
      isLoading={!!groupId && (isLoading || !group)}
      loadingContent={<ModifierGroupDetailSkeleton />}
      isEmpty={!groupId}
      emptyState={
        <Empty
          icon={<Layers />}
          title="Pick a group"
          description="Select a modifier group from the side panel to manage its options."
        />
      }
    >
      {group ? (
        <ModifierGroupDetailContent
          group={group}
          isLoading={isLoading}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onAddOption={onAddOption}
          onEditOption={onEditOption}
          onDeleteOption={onDeleteOption}
        />
      ) : null}
    </PageContentDetails>
  );
};

function ModifierGroupDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

interface ModifierGroupDetailContentProps {
  group: ModifierGroupDetail;
  isLoading: boolean;
  onEditGroup: (group: ModifierGroupDetail) => void;
  onDeleteGroup: (group: ModifierGroupDetail) => void;
  onAddOption: () => void;
  onEditOption: (option: ModifierOptionData) => void;
  onDeleteOption: (option: ModifierOptionData) => void;
}

const ModifierGroupDetailContent: React.FC<ModifierGroupDetailContentProps> = ({
  group,
  isLoading,
  onEditGroup,
  onDeleteGroup,
  onAddOption,
  onEditOption,
  onDeleteOption,
}) => (
  <div className="space-y-6">
    <DetailHeader
      title={group.name}
      badges={
        <>
          {group.minSelections > 0 && <Badge variant="secondary">Required</Badge>}
          <Badge variant="outline">{group.selectionType === 'SINGLE' ? 'Single choice' : 'Multi choice'}</Badge>
        </>
      }
      description={`Min selections: ${group.minSelections} · Max selections: ${group.maxSelections ?? 'Unlimited'}`}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditGroup(group)}
            startAdornment={<Pencil className="size-3.5" />}
          >
            Edit Group
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteGroup(group)}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </>
      }
    />

    <ModifierOptionsTable
      options={group.options}
      groupId={group.id}
      isLoading={isLoading}
      onAddOption={onAddOption}
      onEditOption={onEditOption}
      onDeleteOption={onDeleteOption}
    />
  </div>
);
