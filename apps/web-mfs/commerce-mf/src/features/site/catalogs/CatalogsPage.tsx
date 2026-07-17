import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { BookOpen, Copy, Eye, Pencil, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CatalogData } from '@/schemas/catalogs';
import { CATALOGS_TABLE_KEY, useCatalogsTable } from '@/hooks/site/catalogs';
import { getErrorMessage } from '@/utils/error';
import { CatalogForm } from './forms/CatalogForm';
import { CloneCatalogDialog } from './forms/CloneCatalogDialog';

export const CatalogsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading, error } = useCatalogsTable();

  const addDialog = useDialog();
  const [editingCatalog, setEditingCatalog] = useState<CatalogData | null>(null);
  const editDialog = useDialog({ onClose: () => setEditingCatalog(null) });
  const [cloningCatalog, setCloningCatalog] = useState<CatalogData | null>(null);
  const cloneDialog = useDialog({ onClose: () => setCloningCatalog(null) });

  const handleEdit = useCallback(
    (catalog: CatalogData) => {
      setEditingCatalog(catalog);
      editDialog.open();
    },
    [editDialog],
  );

  const handleClone = useCallback(
    (catalog: CatalogData) => {
      setCloningCatalog(catalog);
      cloneDialog.open();
    },
    [cloneDialog],
  );

  const columns = useMemo<ColumnDef<CatalogData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'channelCount',
        header: 'Channels',
        enableSorting: true,
        cell: ({ row }) => <Badge variant="outline">{row.original.channelCount}</Badge>,
      },
      {
        accessorKey: 'taxInclusive',
        header: 'Tax',
        enableSorting: false,
        cell: ({ row }) => <Badge variant="outline">{row.original.taxInclusive ? 'Inclusive' : 'Exclusive'}</Badge>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        enableSorting: true,
        cell: ({ row }) =>
          row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(buildSlug(row.original.name, row.original.id)),
              },
              { id: 'edit', icon: Pencil, label: 'Edit details', onClick: () => handleEdit(row.original) },
              { id: 'clone', icon: Copy, label: 'Clone catalog', onClick: () => handleClone(row.original) },
            ]}
          />
        ),
      },
    ],
    [handleClone, handleEdit, navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-site-catalogs',
    label: 'catalog',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CATALOGS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalogs"
        description="Pricing and availability, scoped to the sales channels each catalog serves"
        actions={
          <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
            New Catalog
          </Button>
        }
      />

      {error ? <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} /> : null}

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: BookOpen,
          title: 'No catalogs yet',
          description: 'Create a catalog to set prices and availability per site and channel.',
          action: (
            <Button onClick={addDialog.open} startAdornment={<Plus className="size-4" />}>
              New Catalog
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={BookOpen}
        title="New Catalog"
        description="Name the catalog and choose the sales channels it serves."
        className="max-w-lg"
        content={(close) => <CatalogForm onSuccess={close} onCancel={close} />}
      />

      {editingCatalog && (
        <Dialog
          handle={editDialog}
          icon={BookOpen}
          title="Edit Catalog"
          description="Update catalog details."
          className="max-w-lg"
          content={(close) => <CatalogForm catalog={editingCatalog} onSuccess={close} onCancel={close} />}
        />
      )}

      {cloningCatalog && (
        <Dialog
          handle={cloneDialog}
          icon={BookOpen}
          title="Clone Catalog"
          description="Create a new catalog from a copy of this one."
          className="max-w-lg"
          content={(close) => <CloneCatalogDialog catalog={cloningCatalog} onSuccess={close} onCancel={close} />}
        />
      )}
    </div>
  );
};
