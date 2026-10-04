import { Card } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Route } from 'lucide-react';
import type React from 'react';
import { CHANNEL_TYPE_META, type ChannelEntryData, type ChannelTargetData } from '@/schemas/catalog-channels';
import { AssignmentSlot } from './AssignmentSlot';
import type { CatalogChannelsBinding } from './bindings';
import { AssignCatalogDialog } from './forms/AssignCatalogDialog';
import { SCOPE_DOT } from './scope-style';
import { TargetCard } from './TargetCard';
import { useChannelAssignment } from './useChannelAssignment';

interface ChannelCardProps {
  binding: CatalogChannelsBinding;
  entry: ChannelEntryData;
}

// A stacked bar of where the grid's catalogs come from, denser than a bare "2 of 5 overridden"
const Mix: React.FC<{ targets: ChannelTargetData[] }> = ({ targets }) => {
  const overridden = targets.filter((target) => target.isAssigned).length;
  const counts = targets.reduce<Record<string, number>>((acc, target) => {
    const from = target.catalog.ownerScope;
    acc[from] = (acc[from] ?? 0) + 1;
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
      {overridden === 0 ? 'No overrides' : `${overridden} of ${targets.length} overridden`}
    </span>
  );
};

// Why a card has no grid, in the card's own voice
const GridNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border-t bg-muted px-6 py-4 text-muted-foreground text-sm">{children}</div>
);

/**
 * The apps or terminals under one channel, or the reason there are none to show.
 *
 * Three states have to stay distinct: no default yet, so an override would have nothing to except
 * from; a type that names no target at all; and a type whose targets are simply not visible from
 * this workspace.
 */
const TargetGrid: React.FC<ChannelCardProps> = ({ binding, entry }) => {
  const { targets, type, defaultCatalog } = entry;
  const meta = CHANNEL_TYPE_META[type];

  if (!defaultCatalog) return null;

  // An empty grid is a type whose targets this workspace cannot see — terminals above an outlet, or
  // an organization with no apps yet. Which note explains it is a property of the type, not a branch.
  if (targets === null || targets.length === 0) return <GridNote>{meta.emptyNote}</GridNote>;

  return (
    <>
      <div className="flex items-center gap-3 border-t bg-muted px-6 py-2.5">
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          {meta.gridLabel} ({targets.length})
        </span>
        <span className="flex-1" />
        <Mix targets={targets} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-3 px-6 py-5">
        {targets.map((target) => (
          <TargetCard key={target.targetId} binding={binding} type={type} target={target} />
        ))}
      </div>
    </>
  );
};

// One channel: the catalog every unnamed caller gets, then every app or terminal beneath it
export const ChannelCard: React.FC<ChannelCardProps> = ({ binding, entry }) => {
  const meta = CHANNEL_TYPE_META[entry.type];

  // The card owns the default slot's dialog and mutations; each card below owns its own
  const { dialog, submit, remove, openItems, isRemoving } = useChannelAssignment(binding, {
    type: entry.type,
    assignment: entry.defaultCatalog,
  });

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline gap-3 px-6 pt-5 pb-4">
        <h2 className="font-semibold text-base">{meta.label}</h2>
        <span className="text-muted-foreground text-sm">{meta.description}</span>
      </div>

      <div className="border-t">
        <AssignmentSlot
          label={meta.slotLabel}
          assignment={entry.defaultCatalog}
          permission={binding.permissions.edit}
          viewPermission={binding.permissions.view}
          onAssign={dialog.open}
          onChange={dialog.open}
          onRemove={() =>
            remove(
              `Remove the ${meta.slotLabel.toLowerCase()}?`,
              'The catalog itself is untouched. This channel falls back to a wider level, or stops selling if nothing is assigned above.',
            )
          }
          onOpenItems={() => {
            if (entry.defaultCatalog) openItems(entry.defaultCatalog);
          }}
          isRemoving={isRemoving}
        />
      </div>

      <TargetGrid binding={binding} entry={entry} />

      <Dialog
        handle={dialog}
        icon={Route}
        title="Catalog for this channel"
        description="Pick the catalog this surface should sell from. Anything left alone uses the level above."
        content={() => (
          <AssignCatalogDialog
            excludeCatalogIds={[entry.defaultCatalog?.catalogId]}
            {...submit}
            submitLabel="Save"
            onCancel={dialog.close}
          />
        )}
      />
    </Card>
  );
};
