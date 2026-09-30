import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Route } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  AssignCatalogFormData,
  CatalogChannelType,
  ChannelAssignmentData,
  ChannelScreenEntryData,
  ChannelTargetData,
} from '@/schemas/catalog-channels';
import { CHANNEL_TYPE_META } from '@/schemas/catalog-channels';
import type { CatalogChannelsBinding } from './bindings';
import { ChannelCard } from './ChannelCard';
import { AssignCatalogDialog } from './forms/AssignCatalogDialog';

interface ChannelsPageProps {
  binding: CatalogChannelsBinding;
}

// What the open dialog is about to write: a channel's default, or one named target
type Intent =
  | { kind: 'default'; type: CatalogChannelType }
  | { kind: 'target'; type: CatalogChannelType; target: ChannelTargetData };

export const ChannelsPage: React.FC<ChannelsPageProps> = ({ binding }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const dialog = useDialog();
  const [intent, setIntent] = useState<Intent | null>(null);

  const { data: entries = [], isLoading } = binding.useChannelsScreen();

  const createApp = binding.useCreateAppChannel({ onSuccess: dialog.close });
  const createPos = binding.useCreatePosChannel({ onSuccess: dialog.close });
  const createB2b = binding.useCreateB2bChannel({ onSuccess: dialog.close });
  const updateChannel = binding.useUpdateChannel({ onSuccess: dialog.close });
  const deleteChannel = binding.useDeleteChannel();

  const open = useCallback(
    (next: Intent) => {
      setIntent(next);
      dialog.open();
    },
    [dialog],
  );

  /**
   * Which mutation the dialog runs, and how the one field it collects becomes that call's payload.
   *
   * Changing an assignment this workspace owns is an update; overriding an inherited one is a create,
   * because the API refuses to update a channel a wider level owns. Creation is per type since each
   * names a different target — and the target itself is already known from the tile that opened this.
   */
  const resolveSubmit = (entry: ChannelScreenEntryData | undefined) => {
    const existing = intent?.kind === 'target' ? intent.target.assignment : entry?.defaultAssignment;
    const targetId = intent?.kind === 'target' ? intent.target.targetId : null;

    if (existing?.isOwn) {
      return {
        mutation: updateChannel,
        transformSubmit: ({ catalogId }: AssignCatalogFormData) => ({ channelId: existing.channelId, catalogId }),
      };
    }
    if (intent?.type === 'APP') {
      return {
        mutation: createApp,
        transformSubmit: ({ catalogId }: AssignCatalogFormData) => ({ catalogId, appId: targetId }),
      };
    }
    if (intent?.type === 'POS') {
      return {
        mutation: createPos,
        transformSubmit: ({ catalogId }: AssignCatalogFormData) => ({ catalogId, terminalId: targetId }),
      };
    }
    return { mutation: createB2b, transformSubmit: ({ catalogId }: AssignCatalogFormData) => ({ catalogId }) };
  };

  const handleRevert = useCallback(
    async (assignment: ChannelAssignmentData | null, label: string) => {
      if (!assignment) return;
      const ok = await confirm({
        title: `Remove the ${label.toLowerCase()}?`,
        description:
          'The catalog itself is untouched. This surface falls back to a wider level, or stops selling if nothing is assigned above.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) deleteChannel.mutate(assignment.channelId);
    },
    [confirm, deleteChannel],
  );

  const openItems = useCallback(
    (assignment: ChannelAssignmentData) => {
      navigate(buildSlug(assignment.catalogName ?? 'channel', assignment.channelId));
    },
    [navigate],
  );

  const activeEntry = entries.find((entry) => entry.type === intent?.type);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalog Channels"
        description="Which catalog each selling surface uses. A level with nothing set follows the level above it."
      />

      {!isLoading && entries.length === 0 ? (
        <Empty icon={<Route className="size-5" />} title="No channels" description="Nothing to configure here yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <ChannelCard
              key={entry.type}
              binding={binding}
              entry={entry}
              isReverting={deleteChannel.isPending}
              onAssignDefault={() => open({ kind: 'default', type: entry.type })}
              onRevertDefault={() => handleRevert(entry.defaultAssignment, CHANNEL_TYPE_META[entry.type].slotLabel)}
              onAssignTarget={(target) => open({ kind: 'target', type: entry.type, target })}
              onOpenItems={openItems}
            />
          ))}
        </div>
      )}

      <Dialog
        handle={dialog}
        icon={Route}
        title={intent?.kind === 'target' ? `Catalog for ${intent.target.name}` : 'Catalog for this channel'}
        description="Pick the catalog this surface should sell from. Anything left alone follows the level above."
        content={() => (
          <AssignCatalogDialog {...resolveSubmit(activeEntry)} submitLabel="Save" onCancel={dialog.close} />
        )}
      />
    </div>
  );
};
