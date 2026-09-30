import { Button } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import type React from 'react';
import type { ChannelAssignmentData, ChannelTargetData } from '@/schemas/catalog-channels';
import { ScopeBadge } from './AssignmentSlot';
import { SCOPE_EDGE, SCOPE_TINT } from './scope-style';

interface TargetTileProps {
  target: ChannelTargetData;
  fallback: ChannelAssignmentData | null;
  permission: string;
  onAssign: () => void;
  onOpen: () => void;
}

/**
 * One app or terminal, showing what it will actually sell.
 *
 * A tile with no assignment of its own follows the channel default and stays quiet; one that names
 * its own catalog carries the colour of the level that set it, which is how a tile can legitimately
 * disagree with the default above it.
 */
export const TargetTile: React.FC<TargetTileProps> = ({ target, fallback, permission, onAssign, onOpen }) => {
  const effective = target.assignment ?? fallback;
  const assigned = Boolean(target.assignment);
  const owned = target.assignment?.isOwn ?? false;

  return (
    <div
      className={cn(
        'flex min-h-[8rem] flex-col gap-1.5 rounded-lg border p-4 transition-shadow',
        assigned ? `border-l-[3px] ${SCOPE_EDGE[target.assignment?.ownerScope ?? 'ORG']}` : '',
        assigned ? SCOPE_TINT[target.assignment?.ownerScope ?? 'ORG'] : '',
        effective ? 'hover:shadow-md' : '',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-sm">{target.name}</span>
        {target.assignment ? <ScopeBadge assignment={target.assignment} /> : null}
      </div>

      <div className={cn('text-sm', assigned ? '' : 'text-muted-foreground')}>
        {effective ? (
          (effective.catalogName ?? 'Untitled catalog')
        ) : (
          <span className="text-destructive">Not selling</span>
        )}
      </div>

      <div className="text-muted-foreground text-xs">
        {!effective
          ? 'nothing assigned anywhere'
          : owned
            ? 'assigned here'
            : target.assignment
              ? `assigned at ${target.assignment.ownerName}`
              : 'follows the default'}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-2">
        <Button size="xs" variant="outline" onClick={onAssign} permission={permission}>
          {owned ? 'Change' : 'Override'}
        </Button>
        {effective ? (
          <Button size="xs" variant="ghost" onClick={onOpen}>
            {`${effective.itemsSelling} of ${effective.itemsTotal} items`}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
