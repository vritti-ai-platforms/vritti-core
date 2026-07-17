import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, NumberCell, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { ModifierOptionData } from '@/schemas/offerings';

interface ModifierOptionsTableProps {
  options: ModifierOptionData[];
  groupId: string;
  isLoading: boolean;
  onAddOption: () => void;
  onEditOption: (option: ModifierOptionData) => void;
  onDeleteOption: (option: ModifierOptionData) => void;
}

export const ModifierOptionsTable: React.FC<ModifierOptionsTableProps> = ({
  options,
  groupId,
  isLoading,
  onAddOption,
  onEditOption,
  onDeleteOption,
}) => {
  const columns = useMemo<ColumnDef<ModifierOptionData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: false,
      },
      {
        accessorKey: 'additionalPrice',
        header: 'Additional Price',
        enableSorting: false,
        cell: ({ row }) => <NumberCell value={Number(row.original.additionalPrice)} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                onClick: () => onEditOption(row.original),
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => onDeleteOption(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEditOption, onDeleteOption],
  );

  const { table } = useDataTable({
    columns,
    serverState: { result: options },
    slug: `commerce-site-modifier-options-${groupId}`,
    label: 'option',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      mode="tab"
      toolbarActions={{
        actions: (
          <Button size="sm" onClick={onAddOption} startAdornment={<Plus className="size-4" />}>
            Add Option
          </Button>
        ),
      }}
      emptyStateConfig={{
        icon: Layers,
        title: 'No options yet',
        description: 'Add an option to this modifier group.',
        action: (
          <Button onClick={onAddOption} startAdornment={<Plus className="size-4" />}>
            Add Option
          </Button>
        ),
      }}
    />
  );
};
