import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import type React from 'react';
import { type ChannelCatalogData, OWNER_SCOPE_LABEL } from '@/schemas/catalog-channels';
import { SCOPE_EDGE, SCOPE_TINT } from './scope-style';

export const ScopeBadge: React.FC<{ assignment: ChannelCatalogData }> = ({ assignment }) => (
  <Badge variant={assignment.ownerScope === 'ORG' ? 'secondary' : 'outline'}>
    {OWNER_SCOPE_LABEL[assignment.ownerScope]}
  </Badge>
);

interface AssignmentSlotProps {
  label: string;
  assignment: ChannelCatalogData | null;
  permission: string;
  viewPermission: string;
  onAssign: () => void;
  onChange: () => void;
  onRemove: () => void;
  // B2B has no cards at all, and App/POS have none until an app or terminal exists, so the items view
  // has to be reachable from the default too — otherwise those channels have no way in
  onOpenItems: () => void;
  isRemoving?: boolean;
}

/**
 * One assignment: what it sells, where that came from, and the single action available.
 *
 * Inherited offers Override — a create, not an edit, because the API rejects updating a channel this
 * workspace does not own. No label names a scope; the level shown comes from the row.
 */
export const AssignmentSlot: React.FC<AssignmentSlotProps> = ({
  label,
  assignment,
  permission,
  viewPermission,
  onAssign,
  onChange,
  onRemove,
  onOpenItems,
  isRemoving,
}) => {
  if (!assignment) {
    return (
      <div className="flex items-center gap-4 border-destructive border-l-[3px] bg-destructive/5 px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{label}</div>
          <div className="mt-1 font-semibold text-destructive text-lg">No catalog added</div>
          <div className="mt-0.5 text-destructive text-sm">
            Nothing is set at this level or any above it, so this channel has nothing to sell
          </div>
        </div>
        <Button size="sm" onClick={onAssign} permission={permission}>
          Add a catalog
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 border-l-[3px] px-6 py-4',
        SCOPE_EDGE[assignment.ownerScope],
        SCOPE_TINT[assignment.ownerScope],
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{label}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={cn('text-lg', assignment.isOwn ? 'font-semibold' : 'font-medium')}>
            {assignment.catalogName}
          </span>
          <ScopeBadge assignment={assignment} />
          {assignment.catalogIsActive ? null : <Badge variant="warning">Inactive</Badge>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm">
          <span>{assignment.isOwn ? 'Assigned here' : `Inherited from ${assignment.ownerName}`}</span>
          <span aria-hidden>·</span>
          <span>{`${assignment.itemsSelling} of ${assignment.itemsTotal} items`}</span>
        </div>
      </div>

      <div className="flex flex-none items-center gap-2">
        <Button size="sm" onClick={onOpenItems} permission={viewPermission}>
          View Items
        </Button>
        {assignment.isOwn ? (
          <>
            <Button size="sm" variant="outline" onClick={onChange} permission={permission}>
              Change
            </Button>
            <Button size="sm" variant="destructive" onClick={onRemove} permission={permission} isLoading={isRemoving}>
              Remove
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={onAssign} permission={permission}>
            Override
          </Button>
        )}
      </div>
    </div>
  );
};
