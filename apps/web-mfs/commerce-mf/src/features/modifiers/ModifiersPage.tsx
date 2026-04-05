import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@vritti/quantum-ui';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Form } from '@vritti/quantum-ui/Form';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Switch } from '@vritti/quantum-ui/Switch';
import { parseSlug } from '@vritti/quantum-ui/slug';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { useCreateModifierGroup } from '@/hooks/useCreateModifierGroup';
import { useCreateModifierOption } from '@/hooks/useCreateModifierOption';
import { useDeleteModifierGroup } from '@/hooks/useDeleteModifierGroup';
import { useDeleteModifierOption } from '@/hooks/useDeleteModifierOption';
import { useModifierGroup } from '@/hooks/useModifierGroup';
import { useModifierGroups } from '@/hooks/useModifierGroups';
import { useUpdateModifierGroup } from '@/hooks/useUpdateModifierGroup';
import { useUpdateModifierOption } from '@/hooks/useUpdateModifierOption';
import type { ModifierGroupData, ModifierOptionData } from '@/schemas/items';
import {
  type CreateModifierGroupFormData,
  type CreateModifierOptionFormData,
  createModifierGroupSchema,
  createModifierOptionSchema,
} from '@/schemas/modifiers';

function extractBuIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const buSegment = segments.find((s) => s.startsWith('bu-'));
  if (!buSegment) return null;
  const parsed = parseSlug(buSegment.replace(/^bu-/, ''));
  return parsed?.id ?? null;
}

function formatPrice(price: string): string {
  const num = Number.parseFloat(price);
  return Number.isNaN(num) ? price : num.toFixed(2);
}

const selectionTypeOptions = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MULTI', label: 'Multi' },
];

export const ModifiersPage = () => {
  const location = useLocation();
  const selectedBuId = extractBuIdFromPath(location.pathname);

  const { data: groups = [], isLoading } = useModifierGroups(selectedBuId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: selectedGroupDetail, isLoading: isLoadingDetail } = useModifierGroup(selectedGroupId);

  const deleteMutation = useDeleteModifierGroup();
  const deleteOptionMutation = useDeleteModifierOption();

  const createGroupDialog = useDialog();
  const editGroupDialog = useDialog();
  const addOptionDialog = useDialog();
  const editOptionDialog = useDialog();
  const confirm = useConfirm();

  const [editingOption, setEditingOption] = useState<ModifierOptionData | null>(null);

  // Filters groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  // Handles selecting a group from the list
  const handleSelectGroup = useCallback((group: ModifierGroupData) => {
    setSelectedGroupId(group.id);
  }, []);

  // Handles deleting a modifier group
  const handleDeleteGroup = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description:
          'This modifier group and all its options will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) {
        deleteMutation.mutate(id);
        if (selectedGroupId === id) setSelectedGroupId(null);
      }
    },
    [confirm, deleteMutation, selectedGroupId],
  );

  // Handles deleting a modifier option
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
        deleteOptionMutation.mutate({ groupId: selectedGroupId, optionId: option.id });
      }
    },
    [confirm, deleteOptionMutation, selectedGroupId],
  );

  // Opens the edit dialog for a modifier option
  const handleEditOption = useCallback(
    (option: ModifierOptionData) => {
      setEditingOption(option);
      editOptionDialog.open();
    },
    [editOptionDialog],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Modifier Groups" description="Manage modifier groups and their options" />

      <div className="flex gap-6 min-h-[600px]">
        {/* Left panel — group list */}
        <div className="w-96 shrink-0 flex flex-col border rounded-lg bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-sm font-semibold">Groups</h3>
            <Button size="sm" variant="ghost" onClick={createGroupDialog.open}>
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="p-3 border-b">
            <TextField
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search className="size-4 text-muted-foreground" />}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No groups match your search.' : 'No modifier groups yet.'}
                </p>
                {!searchQuery && (
                  <Button size="sm" variant="link" onClick={createGroupDialog.open} className="mt-2">
                    Create your first group
                  </Button>
                )}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  isSelected={selectedGroupId === group.id}
                  onClick={() => handleSelectGroup(group)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel — group detail */}
        <div className="flex-1 min-w-0">
          {selectedGroupId && selectedGroupDetail ? (
            <GroupDetailPanel
              group={selectedGroupDetail}
              isLoading={isLoadingDetail}
              onEdit={editGroupDialog.open}
              onAddOption={addOptionDialog.open}
              onDeleteGroup={() => handleDeleteGroup(selectedGroupDetail.id, selectedGroupDetail.name)}
              onDeleteOption={handleDeleteOption}
              onEditOption={handleEditOption}
            />
          ) : (
            <div className="flex items-center justify-center h-full border rounded-lg bg-card">
              <Empty
                icon={<Layers className="size-8" />}
                title="No group selected"
                description="Select a modifier group from the list or create a new one."
                action={
                  <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={createGroupDialog.open}>
                    Create Group
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Create group dialog */}
      <Dialog
        handle={createGroupDialog}
        title="Create Modifier Group"
        description="Set up a new modifier group with selection rules."
        content={(close) => (
          <CreateGroupForm
            businessUnitId={selectedBuId ?? ''}
            onSuccess={(newGroup) => {
              setSelectedGroupId(newGroup.id);
              close();
            }}
            onCancel={close}
          />
        )}
      />

      {/* Edit group dialog */}
      {selectedGroupDetail && (
        <Dialog
          handle={editGroupDialog}
          title="Edit Modifier Group"
          description="Update modifier group settings."
          content={(close) => <EditGroupForm group={selectedGroupDetail} onSuccess={close} onCancel={close} />}
        />
      )}

      {/* Add option dialog */}
      {selectedGroupId && (
        <Dialog
          handle={addOptionDialog}
          title="Add Option"
          description="Add a new option to this modifier group."
          content={(close) => <AddOptionForm groupId={selectedGroupId} onSuccess={close} onCancel={close} />}
        />
      )}

      {/* Edit option dialog */}
      {selectedGroupId && editingOption && (
        <Dialog
          handle={editOptionDialog}
          title="Edit Option"
          description="Update this modifier option."
          content={(close) => (
            <EditOptionForm groupId={selectedGroupId} option={editingOption} onSuccess={close} onCancel={close} />
          )}
        />
      )}
    </div>
  );
};

// Renders a single group item in the left sidebar list
interface GroupListItemProps {
  group: ModifierGroupData;
  isSelected: boolean;
  onClick: () => void;
}

const GroupListItem = ({ group, isSelected, onClick }: GroupListItemProps) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={cn('w-full justify-start rounded-none px-4 py-3 border-b h-auto', isSelected && 'bg-muted')}
  >
    <div className="flex items-center justify-between w-full">
      <span className="text-sm font-medium truncate">{group.name}</span>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {group.minSelections > 0 && (
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
            Required
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {group.selectionType === 'SINGLE' ? 'Single' : 'Multi'}
        </Badge>
      </div>
    </div>
  </Button>
);

// Renders the detail panel for a selected modifier group
interface GroupDetailPanelProps {
  group: ModifierGroupData & { options?: ModifierOptionData[] };
  isLoading: boolean;
  onEdit: () => void;
  onAddOption: () => void;
  onDeleteGroup: () => void;
  onDeleteOption: (option: ModifierOptionData) => void;
  onEditOption: (option: ModifierOptionData) => void;
}

const GroupDetailPanel = ({
  group,
  isLoading,
  onEdit,
  onAddOption,
  onDeleteGroup,
  onDeleteOption,
  onEditOption,
}: GroupDetailPanelProps) => (
  <div className="flex flex-col gap-4">
    {/* Header */}
    <div className="flex items-start justify-between border rounded-lg bg-card p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{group.name}</h2>
          {group.minSelections > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Required
            </Badge>
          )}
          <Badge variant="outline">{group.selectionType === 'SINGLE' ? 'Single choice' : 'Multi choice'}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Min selections: {group.minSelections}</span>
          <span>Max selections: {group.maxSelections ?? 'Unlimited'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" startAdornment={<Pencil className="size-3.5" />} onClick={onEdit}>
          Edit Group
        </Button>
        <Button
          variant="destructive"
          size="sm"
          startAdornment={<Trash2 className="size-3.5" />}
          onClick={onDeleteGroup}
        >
          Delete
        </Button>
      </div>
    </div>

    {/* Options table */}
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Options</CardTitle>
        <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={onAddOption}>
          Add Option
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : !group.options || group.options.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No options yet.</p>
            <Button size="sm" variant="link" onClick={onAddOption} className="mt-1">
              Add your first option
            </Button>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium px-4 py-2.5">Name</th>
                  <th className="text-right font-medium px-4 py-2.5">Additional Price</th>
                  <th className="w-20 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {group.options.map((option) => (
                  <tr key={option.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{option.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                      {formatPrice(option.additionalPrice)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => onEditOption(option)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => onDeleteOption(option)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

// Form for creating a new modifier group
interface CreateGroupFormProps {
  businessUnitId: string;
  onSuccess: (group: ModifierGroupData) => void;
  onCancel: () => void;
}

const CreateGroupForm = ({ businessUnitId, onSuccess, onCancel }: CreateGroupFormProps) => {
  const form = useForm<CreateModifierGroupFormData>({
    resolver: zodResolver(createModifierGroupSchema),
    defaultValues: {
      name: '',
      selectionType: 'SINGLE',
      isRequired: false,
      minSelections: '0',
      maxSelections: '',
    },
  });

  const createMutation = useCreateModifierGroup({
    onSuccess: (data) => onSuccess(data),
  });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        businessUnitId,
        name: data.name,
        selectionType: data.selectionType,
        minSelections: data.isRequired ? Math.max(Number(data.minSelections) || 0, 1) : 0,
        maxSelections: data.maxSelections ? Number(data.maxSelections) : undefined,
        isActive: true,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Toppings" />
      <RadioGroup name="selectionType" label="Selection Type" options={selectionTypeOptions} orientation="horizontal" />
      <Switch name="isRequired" label="Required" />
      <TextField name="minSelections" label="Min Selections" type="number" placeholder="0" />
      <TextField name="maxSelections" label="Max Selections" type="number" placeholder="Leave empty for unlimited" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Group
        </Button>
      </div>
    </Form>
  );
};

// Form for editing an existing modifier group
interface EditGroupFormProps {
  group: ModifierGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditGroupForm = ({ group, onSuccess, onCancel }: EditGroupFormProps) => {
  const form = useForm<CreateModifierGroupFormData>({
    resolver: zodResolver(createModifierGroupSchema),
    defaultValues: {
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.minSelections > 0,
      minSelections: String(group.minSelections),
      maxSelections: group.maxSelections != null ? String(group.maxSelections) : '',
    },
  });

  const updateMutation = useUpdateModifierGroup({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: group.id,
        data: {
          name: data.name,
          selectionType: data.selectionType,
          minSelections: data.isRequired ? Math.max(Number(data.minSelections) || 0, 1) : 0,
          maxSelections: data.maxSelections ? Number(data.maxSelections) : null,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Toppings" />
      <RadioGroup name="selectionType" label="Selection Type" options={selectionTypeOptions} orientation="horizontal" />
      <Switch name="isRequired" label="Required" />
      <TextField name="minSelections" label="Min Selections" type="number" placeholder="0" />
      <TextField name="maxSelections" label="Max Selections" type="number" placeholder="Leave empty for unlimited" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};

// Form for adding an option to a modifier group
interface AddOptionFormProps {
  groupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddOptionForm = ({ groupId, onSuccess, onCancel }: AddOptionFormProps) => {
  const form = useForm<CreateModifierOptionFormData>({
    resolver: zodResolver(createModifierOptionSchema),
    defaultValues: {
      name: '',
      additionalPrice: '',
    },
  });

  const createMutation = useCreateModifierOption({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        groupId,
        data: {
          name: data.name,
          additionalPrice: Number(data.additionalPrice),
        },
      })}
    >
      <TextField name="name" label="Option Name" placeholder="e.g. Extra Cheese" />
      <TextField name="additionalPrice" label="Additional Price" type="number" placeholder="0.00" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Option
        </Button>
      </div>
    </Form>
  );
};

// Form for editing an existing modifier option
interface EditOptionFormProps {
  groupId: string;
  option: ModifierOptionData;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditOptionForm = ({ groupId, option, onSuccess, onCancel }: EditOptionFormProps) => {
  const form = useForm<CreateModifierOptionFormData>({
    resolver: zodResolver(createModifierOptionSchema),
    defaultValues: {
      name: option.name,
      additionalPrice: option.additionalPrice,
    },
  });

  const updateMutation = useUpdateModifierOption({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({
        groupId,
        optionId: option.id,
        data: {
          name: data.name,
          additionalPrice: Number(data.additionalPrice),
        },
      })}
    >
      <TextField name="name" label="Option Name" placeholder="e.g. Extra Cheese" />
      <TextField name="additionalPrice" label="Additional Price" type="number" placeholder="0.00" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
