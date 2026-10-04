import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useNavigate } from 'react-router-dom';
import type { AssignCatalogFormData, CatalogChannelType, ChannelCatalogData } from '@/schemas/catalog-channels';
import { CatalogChannelTypeValues } from '@/schemas/catalog-channels';
import type { CatalogChannelsBinding } from './bindings';

interface Slot {
  type: CatalogChannelType;
  // The row at THIS slot, never the one it inherits — removing is the one action that needs a row,
  // and deleting an inherited one would take the catalog away from every level below it too
  assignment: ChannelCatalogData | null;
  // The app or terminal this slot stands for; absent when it is a channel's own default
  targetId?: string | null;
}

/**
 * Everything one slot can do — a channel's default, or a single app or terminal.
 *
 * Each slot owns its dialog and its mutations, so a pending save or delete belongs to the button that
 * started it and no caller has to track which of them is busy. The items route is here for the same
 * reason: the card that offers the action is the one that knows which catalog it would open.
 */
export function useChannelAssignment(binding: CatalogChannelsBinding, slot: Slot) {
  const dialog = useDialog();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const upsertChannel = binding.useUpsertChannel({ onSuccess: dialog.close });
  const deleteChannel = binding.useDeleteChannel();

  // One call whether or not this workspace already owns a row here: the API repoints its own row, or
  // stamps a new one that outranks whatever it was inheriting
  const submit = {
    mutation: upsertChannel,
    transformSubmit: ({ catalogId }: AssignCatalogFormData) => ({
      type: slot.type,
      catalogId,
      // Only POS names a till; APP and B2B both name an app. Left undefined for a channel's own
      // default so the request carries no target at all, rather than a null that reads as one.
      appId: slot.type === CatalogChannelTypeValues.POS ? undefined : slot.targetId,
      terminalId: slot.type === CatalogChannelTypeValues.POS ? slot.targetId : undefined,
    }),
  };

  // Confirms, then deletes. Copy differs between a default and one target, so the caller supplies it
  const remove = async (title: string, description: string) => {
    const existing = slot.assignment;
    if (!existing) return;
    const ok = await confirm({ title, description, confirmLabel: 'Remove', variant: 'destructive' });
    if (ok) deleteChannel.mutate(existing.channelId);
  };

  // Opens the item list of whatever the slot resolves to, which is not always its own row
  const openItems = (catalog: ChannelCatalogData) => {
    navigate(buildSlug(catalog.catalogName, catalog.channelId));
  };

  return { dialog, submit, remove, openItems, isRemoving: deleteChannel.isPending };
}
