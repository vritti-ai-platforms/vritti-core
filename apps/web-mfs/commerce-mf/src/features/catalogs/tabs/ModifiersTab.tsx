import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent } from '@vritti/quantum-ui/PageContent';
import { BookOpen } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useDeleteModifierGroup, useDeleteModifierOption } from '@/hooks/modifiers';
import type { ModifierGroupDetail } from '@/schemas/modifiers';
import type { ModifierOptionData } from '@/schemas/offerings';
import { ModifierGroupDetailPanel } from '../components/modifiers/ModifierGroupDetailPanel';
import { ModifierGroupsPanel } from '../components/modifiers/ModifierGroupsPanel';
import { AddModifierOptionForm } from '../forms/modifiers/AddModifierOptionForm';
import { CreateModifierGroupForm } from '../forms/modifiers/CreateModifierGroupForm';
import { EditModifierGroupForm } from '../forms/modifiers/EditModifierGroupForm';
import { EditModifierOptionForm } from '../forms/modifiers/EditModifierOptionForm';

interface ModifiersTabProps {
  catalogId: string;
}

export const ModifiersTab: React.FC<ModifiersTabProps> = ({ catalogId }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<ModifierGroupDetail | null>(null);
  const [editingOption, setEditingOption] = useState<ModifierOptionData | null>(null);

  const createGroupDialog = useDialog();
  const editGroupDialog = useDialog();
  const addOptionDialog = useDialog();
  const editOptionDialog = useDialog();
  const confirm = useConfirm();

  const deleteGroupMutation = useDeleteModifierGroup();
  const deleteOptionMutation = useDeleteModifierOption();

  const handleEditGroup = useCallback(
    (group: ModifierGroupDetail) => {
      setEditingGroup(group);
      editGroupDialog.open();
    },
    [editGroupDialog],
  );

  const handleDeleteGroup = useCallback(
    async (group: ModifierGroupDetail) => {
      const confirmed = await confirm({
        title: `Delete "${group.name}"?`,
        description:
          'This modifier group and all its options will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) {
        deleteGroupMutation.mutate({ catalogId, groupId: group.id }, { onSuccess: () => setSelectedGroupId(null) });
      }
    },
    [confirm, deleteGroupMutation, catalogId],
  );

  const handleEditOption = useCallback(
    (option: ModifierOptionData) => {
      setEditingOption(option);
      editOptionDialog.open();
    },
    [editOptionDialog],
  );

  const handleDeleteOption = useCallback(
    async (option: ModifierOptionData) => {
      if (!selectedGroupId) return;
      const confirmed = await confirm({
        title: `Delete "${option.name}"?`,
        description: 'This option will be permanently removed.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) {
        deleteOptionMutation.mutate({ catalogId, groupId: selectedGroupId, optionId: option.id });
      }
    },
    [confirm, deleteOptionMutation, selectedGroupId, catalogId],
  );

  return (
    <>
      <PageContent>
        <ModifierGroupsPanel
          catalogId={catalogId}
          selectedId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onAddGroup={createGroupDialog.open}
        />
        <ModifierGroupDetailPanel
          catalogId={catalogId}
          groupId={selectedGroupId}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddOption={addOptionDialog.open}
          onEditOption={handleEditOption}
          onDeleteOption={handleDeleteOption}
        />
      </PageContent>

      <Dialog
        handle={createGroupDialog}
        icon={BookOpen}
        title="Create Modifier Group"
        description="Set up a new modifier group with selection rules."
        content={(close) => (
          <CreateModifierGroupForm
            catalogId={catalogId}
            onSuccess={(group) => {
              setSelectedGroupId(group.id);
              close();
            }}
            onCancel={close}
          />
        )}
      />

      {editingGroup && (
        <Dialog
          handle={editGroupDialog}
          icon={BookOpen}
          title="Edit Modifier Group"
          description="Update modifier group settings."
          content={(close) => (
            <EditModifierGroupForm catalogId={catalogId} group={editingGroup} onSuccess={close} onCancel={close} />
          )}
        />
      )}

      {selectedGroupId && (
        <Dialog
          handle={addOptionDialog}
          icon={BookOpen}
          title="Add Option"
          description="Add a new option to this modifier group."
          content={(close) => (
            <AddModifierOptionForm catalogId={catalogId} groupId={selectedGroupId} onSuccess={close} onCancel={close} />
          )}
        />
      )}

      {selectedGroupId && editingOption && (
        <Dialog
          handle={editOptionDialog}
          icon={BookOpen}
          title="Edit Option"
          description="Update this modifier option."
          content={(close) => (
            <EditModifierOptionForm
              catalogId={catalogId}
              groupId={selectedGroupId}
              option={editingOption}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}
    </>
  );
};
