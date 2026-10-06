import { Button } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Route } from 'lucide-react';
import type React from 'react';
import type { CatalogChannelType, ChannelTargetData } from '@/schemas/catalog-channels';
import { ScopeBadge } from './AssignmentSlot';
import type { CatalogChannelsBinding } from './bindings';
import { AssignCatalogDialog } from './forms/AssignCatalogDialog';
import { SCOPE_EDGE, SCOPE_TINT } from './scope-style';
import { useChannelAssignment } from './useChannelAssignment';

interface TargetCardProps {
  binding: CatalogChannelsBinding;
  type: CatalogChannelType;
  target: ChannelTargetData;
}

// One app or terminal, showing what it will actually sell
export const TargetCard: React.FC<TargetCardProps> = ({ binding, type, target }) => {
  const { catalog, isAssigned } = target;
  // Owned means this workspace may edit the row itself; a target named by a wider level is assigned
  // but not owned, so it can only be overridden
  const owned = isAssigned && catalog.isOwn;

  const { dialog, submit, remove, openItems, isRemoving } = useChannelAssignment(binding, {
    type,
    assignment: isAssigned ? catalog : null,
    targetId: target.targetId,
  });

  return (
    <div
      className={cn(
        'flex min-h-32 flex-col gap-1.5 rounded-lg border p-4 transition-shadow',
        isAssigned ? `border-l-[3px] ${SCOPE_EDGE[catalog.ownerScope]}` : '',
        isAssigned ? SCOPE_TINT[catalog.ownerScope] : '',
        'hover:shadow-md',
      )}
    >
      {/* The target and what it sells read as one sentence; the badge says which level decided */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm">
        <span className="font-semibold">{target.name}</span>
        <span className={isAssigned ? '' : 'text-muted-foreground'}>
          {'using '}
          {catalog.catalogName}
        </span>
        {isAssigned ? <ScopeBadge assignment={catalog} /> : null}
      </div>

      <div className="text-muted-foreground text-xs">{`${catalog.itemsSelling} of ${catalog.itemsTotal} items`}</div>

      {/* Three actions do not fit a card on one line, so they wrap rather than squash */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <Button size="xs" onClick={() => openItems(catalog)} permission={binding.permissions.view}>
          View Items
        </Button>
        <Button size="xs" variant="outline" onClick={dialog.open} permission={binding.permissions.edit}>
          {owned ? 'Change' : 'Override'}
        </Button>
        {/* Only a row this workspace owns can be removed; anything else offers Override */}
        {owned ? (
          <Button
            size="xs"
            variant="destructive"
            permission={binding.permissions.edit}
            isLoading={isRemoving}
            onClick={() =>
              remove(
                `Remove the catalog for ${target.name}?`,
                'The catalog itself is untouched. This one goes back to using the channel default.',
              )
            }
          >
            Remove
          </Button>
        ) : null}
      </div>

      <Dialog
        handle={dialog}
        icon={Route}
        title={`Catalog for ${target.name}`}
        description="Pick the catalog this surface should sell from. Anything left alone uses the level above."
        content={() => (
          <AssignCatalogDialog
            excludeCatalogIds={[catalog.catalogId]}
            {...submit}
            submitLabel="Save"
            onCancel={dialog.close}
          />
        )}
      />
    </div>
  );
};
