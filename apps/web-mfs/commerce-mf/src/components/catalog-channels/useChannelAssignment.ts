import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { useNavigate } from 'react-router-dom';
import type { AssignCatalogFormData, CatalogChannelType, ChannelCatalogData } from '@/schemas/catalog-channels';
import { CatalogChannelTypeValues } from '@/schemas/catalog-channels';
import type { CatalogChannelsBinding } from './bindings';

interface Slot {
  type: CatalogChannelType;
  assignment: ChannelCatalogData | null;
  targetId?: string | null;
}

// Everything one slot can do — a channel's default, or a single app or terminal
export function useChannelAssignment(binding: CatalogChannelsBinding, slot: Slot) {
  const dialog = useDialog();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const upsertChannel = binding.useUpsertChannel({ onSuccess: dialog.close });
  const deleteChannel = binding.useDeleteChannel();

  const submit = {
    mutation: upsertChannel,
    transformSubmit: ({ catalogId }: AssignCatalogFormData) => ({
      type: slot.type,
      catalogId,
      appId: slot.type === CatalogChannelTypeValues.POS ? undefined : slot.targetId,
      terminalId: slot.type === CatalogChannelTypeValues.POS ? slot.targetId : undefined,
    }),
  };

  // Confirms, then deletes.
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
