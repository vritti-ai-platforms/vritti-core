import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ListTree, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { TerminalPriceListData } from '@/schemas/price-lists';
import type { PosTerminalData } from '@/schemas/pos-terminals';
import { getErrorMessage } from '@/utils/error';
import { PriceListAssignmentForm } from '../forms/PriceListAssignmentForm';
import { usePriceListAssignments } from '../hooks/usePriceListAssignments';

interface TerminalPriceListsPanelProps {
  terminal: PosTerminalData;
}

export const TerminalPriceListsPanel: React.FC<TerminalPriceListsPanelProps> = ({ terminal }) => {
  const confirm = useConfirm();
  const {
    priceLists,
    existingPriceListIds,
    isLoading,
    isSaving,
    error,
    addAssignment,
    updateAssignment,
    removeAssignment,
  } = usePriceListAssignments(terminal.id);

  const addDialog = useDialog();
  const [editingPriceList, setEditingPriceList] = useState<TerminalPriceListData | null>(null);
  const editDialog = useDialog({ onClose: () => setEditingPriceList(null) });

  const handleEdit = (priceList: TerminalPriceListData) => {
    setEditingPriceList(priceList);
    editDialog.open();
  };

  const handleRemove = async (priceList: TerminalPriceListData) => {
    const confirmed = await confirm({
      title: `Remove "${priceList.priceListName}"?`,
      description: 'This price list will no longer be assigned to this terminal.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeAssignment(priceList.priceListId);
  };

  const columns: ColumnDef<TerminalPriceListData>[] = [
    {
      id: 'priceList',
      header: 'Price List',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.priceListName}</span>
          <Typography variant="caption">{row.original.priceListCode}</Typography>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      enableSorting: false,
    },
    {
      accessorKey: 'isDefault',
      header: 'Default',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isDefault ? (
          <Badge variant="secondary" className="bg-success/15 text-success">
            Default
          </Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            { id: 'edit', icon: Pencil, label: 'Edit', disabled: isSaving, onClick: () => handleEdit(row.original) },
            {
              id: 'remove',
              icon: Trash2,
              label: 'Remove',
              variant: 'destructive',
              disabled: isSaving,
              onClick: () => handleRemove(row.original),
            },
          ]}
        />
      ),
    },
  ];

  const { table } = useDataTable({
    columns,
    slug: `commerce-pos-terminal-price-lists-${terminal.id}`,
    label: 'terminal price list',
    serverState: { result: priceLists, count: priceLists.length },
    enableRowSelection: false,
    enableSorting: false,
    enableMultiSort: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} />;
  }

  const editExcludedIds = editingPriceList
    ? existingPriceListIds.filter((priceListId) => priceListId !== editingPriceList.priceListId)
    : [];

  const addButton = (
    <Button
      type="button"
      size="sm"
      onClick={addDialog.open}
      disabled={isSaving}
      startAdornment={<Plus className="size-4" />}
    >
      Add Price List
    </Button>
  );

  return (
    <>
      <DataTable
        table={table}
        mode="compact"
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={{
          icon: ListTree,
          title: 'No price lists assigned',
          description: 'Add one or more price lists for this terminal.',
          action: addButton,
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Price List"
        description="Assign a price list to this terminal."
        className="max-w-lg"
        content={(close) => (
          <PriceListAssignmentForm
            defaultValues={{ priceListId: '', priority: String(priceLists.length), isDefault: false }}
            excludedPriceListIds={existingPriceListIds}
            submitLabel="Add Price List"
            onSubmit={(values) => addAssignment(values, close)}
            onCancel={close}
          />
        )}
      />

      {editingPriceList && (
        <Dialog
          handle={editDialog}
          title="Edit Price List Assignment"
          description="Update assignment settings for this terminal."
          className="max-w-lg"
          content={(close) => (
            <PriceListAssignmentForm
              defaultValues={{
                priceListId: editingPriceList.priceListId,
                priority: String(editingPriceList.priority),
                isDefault: editingPriceList.isDefault,
              }}
              excludedPriceListIds={editExcludedIds}
              submitLabel="Save Changes"
              onSubmit={(values) => updateAssignment(editingPriceList.priceListId, values, close)}
              onCancel={close}
            />
          )}
        />
      )}
    </>
  );
};
