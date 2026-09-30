import { Card } from '@vritti/quantum-ui/Card';
import { cn } from '@vritti/quantum-ui/cn';
import type React from 'react';
import {
  CHANNEL_TYPE_META,
  type ChannelAssignmentData,
  type ChannelScreenEntryData,
  type ChannelTargetData,
} from '@/schemas/catalog-channels';
import { AssignmentSlot } from './AssignmentSlot';
import type { CatalogChannelsBinding } from './bindings';
import { SCOPE_DOT } from './scope-style';
import { TargetTile } from './TargetTile';

interface ChannelCardProps {
  binding: CatalogChannelsBinding;
  entry: ChannelScreenEntryData;
  onAssignDefault: () => void;
  onRevertDefault: () => void;
  onAssignTarget: (target: ChannelTargetData) => void;
  onOpenItems: (assignment: ChannelAssignmentData) => void;
  isReverting: boolean;
}

// A stacked bar of where the grid's values come from, denser than a bare "2 of 5 differ"
const Mix: React.FC<{ targets: ChannelTargetData[]; fallback: ChannelAssignmentData | null }> = ({
  targets,
  fallback,
}) => {
  const differ = targets.filter((target) => target.assignment).length;
  const counts = targets.reduce<Record<string, number>>((acc, target) => {
    const from = (target.assignment ?? fallback)?.ownerScope;
    if (from) acc[from] = (acc[from] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <span className="flex items-center gap-2 text-muted-foreground text-xs">
      <span className="flex h-1.5 w-20 overflow-hidden rounded-full bg-border">
        {(['ORG', 'LE', 'SITE'] as const).map((scope) =>
          counts[scope] ? (
            <span
              key={scope}
              className={SCOPE_DOT[scope]}
              style={{ width: `${(counts[scope] / targets.length) * 100}%` }}
            />
          ) : null,
        )}
      </span>
      {differ === 0 ? 'all follow the default' : `${differ} of ${targets.length} differ`}
    </span>
  );
};

/**
 * One channel: its default assignment, then every app or terminal beneath it.
 *
 * B2B never has a grid — it names no target — and POS has none above an outlet, where terminals are
 * not visible. Both cases say so rather than showing an empty grid.
 */
export const ChannelCard: React.FC<ChannelCardProps> = ({
  binding,
  entry,
  onAssignDefault,
  onRevertDefault,
  onAssignTarget,
  onOpenItems,
  isReverting,
}) => {
  const meta = CHANNEL_TYPE_META[entry.type];
  const targets = entry.targets;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline gap-3 px-6 pt-5 pb-4">
        <h2 className="font-semibold text-base">{meta.label}</h2>
        <span className="text-muted-foreground text-sm">{meta.description}</span>
      </div>

      <div className="border-t">
        <AssignmentSlot
          label={meta.slotLabel}
          assignment={entry.defaultAssignment}
          permission={binding.permissions.edit}
          onAssign={onAssignDefault}
          onChange={onAssignDefault}
          onRevert={onRevertDefault}
          onOpenItems={() => {
            if (entry.defaultAssignment) onOpenItems(entry.defaultAssignment);
          }}
          isReverting={isReverting}
        />
      </div>

      {targets === null ? (
        <div className="border-t bg-muted px-6 py-4 text-muted-foreground text-sm">
          B2B names no individual target, so this is the single wholesale assignment for this level.
        </div>
      ) : targets.length === 0 ? (
        <div className="border-t bg-muted px-6 py-4 text-muted-foreground text-sm">
          {entry.type === 'POS'
            ? 'Terminals belong to an outlet, so they are listed only in an outlet workspace. This level sets the default they follow.'
            : 'No apps are registered yet. Every app you add will follow the default above.'}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-t bg-muted px-6 py-2.5">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              {meta.gridLabel} ({targets.length})
            </span>
            <span className="flex-1" />
            <Mix targets={targets} fallback={entry.defaultAssignment} />
          </div>
          <div className={cn('grid gap-3 px-6 py-5', 'grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]')}>
            {targets.map((target) => (
              <TargetTile
                key={target.targetId}
                target={target}
                fallback={entry.defaultAssignment}
                permission={binding.permissions.edit}
                onAssign={() => onAssignTarget(target)}
                onOpen={() => {
                  const assignment = target.assignment ?? entry.defaultAssignment;
                  if (assignment) onOpenItems(assignment);
                }}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
