import { Avatar, AvatarFallback } from '@vritti/quantum-ui/Avatar';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { parseSlug } from '@vritti/quantum-ui/slug';
import { Eye, Package, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDeleteItem } from '@/hooks/useDeleteItem';
import { useItems } from '@/hooks/useItems';
import type { ItemData, ItemType } from '@/schemas/items';
import { AddItemDialog } from './forms/AddItemDialog';

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

export const ItemsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedBuId = extractBuIdFromPath(location.pathname);

  const { data: items = [], isLoading } = useItems(selectedBuId);
  const deleteMutation = useDeleteItem();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filters items by type and status
  const filteredItems = useMemo(() => {
    let result = items;
    if (typeFilter !== 'ALL') {
      result = result.filter((item) => item.type === typeFilter);
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((item) => (statusFilter === 'ACTIVE' ? item.isAvailable : !item.isAvailable));
    }
    return result;
  }, [items, typeFilter, statusFilter]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm({
        title: `Delete "${name}"?`,
        description: 'This item will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`${location.pathname}/${id}`);
    },
    [navigate, location.pathname],
  );

  const columns = useMemo(() => getColumns(handleDelete, handleView), [handleDelete, handleView]);

  const { table } = useDataTable({
    columns,
    label: 'Item',
    slug: 'item',
    serverState: { result: filteredItems, count: filteredItems.length },
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Items" description="Manage items for this business unit" />

      <DataTable
        table={table}
        isLoading={isLoading}
        enableViews={false}
        toolbarActions={{
          actions: (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {(['ALL', 'PRODUCT', 'SERVICE'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
                  >
                    {type === 'ALL' ? 'All' : type === 'PRODUCT' ? 'Products' : 'Services'}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Button>
                ))}
              </div>
              <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
                Add Item
              </Button>
            </div>
          ),
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No items found',
          description: 'Add your first item to get started.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} size="sm" onClick={addDialog.open}>
              Add Item
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Item"
        description="Enter the details for the new item."
        content={(close) => <AddItemDialog businessUnitId={selectedBuId ?? ''} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};

function getColumns(
  onDelete: (id: string, name: string) => Promise<void>,
  onView: (id: string) => void,
): ColumnDef<ItemData, unknown>[] {
  return [
    {
      id: 'image',
      header: '',
      cell: ({ row }) => (
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{row.original.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
      size: 48,
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.type === 'PRODUCT' && (
            <Badge variant="outline" className="text-xs">
              {row.original.categoryName ?? 'Uncategorized'}
            </Badge>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isProduct = row.original.type === 'PRODUCT';
        return (
          <Badge
            variant="secondary"
            className={isProduct ? 'bg-primary/10 text-primary' : 'bg-accent/50 text-accent-foreground'}
          >
            {isProduct ? 'Product' : 'Service'}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'basePrice',
      header: () => <div className="text-right">Base Price</div>,
      cell: ({ row }) => <div className="text-right font-mono">{formatPrice(row.original.basePrice)}</div>,
      enableSorting: true,
    },
    {
      accessorKey: 'isAvailable',
      header: 'Status',
      cell: ({ row }) => {
        const { isAvailable } = row.original;
        return (
          <Badge
            variant={isAvailable ? 'secondary' : 'outline'}
            className={isAvailable ? 'bg-success/15 text-success' : ''}
          >
            {isAvailable ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              id: 'view',
              icon: Eye,
              label: 'View',
              onClick: () => onView(row.original.id),
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              onClick: () => onDelete(row.original.id, row.original.name),
            },
          ]}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
