import { useQueryClient } from '@tanstack/react-query';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, NumberCell, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { BookOpen, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOGS_TABLE_KEY, useCatalogsTable } from '@/hooks/organization/catalogs';
import type { CatalogData } from '@/schemas/catalogs';
import { AddCatalogDialog } from './forms/AddCatalogDialog';

export const CatalogsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = useCatalogsTable();
  const addDialog = useDialog();
  const columns = useMemo<ColumnDef<CatalogData>[]>(
    () => [
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'taxInclusive',
        header: () => <div className="text-center">Prices</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant="outline">{row.original.taxInclusive ? 'Tax inclusive' : 'Tax exclusive'}</Badge>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'listingCount',
        header: () => <div className="text-center">Listings</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <NumberCell value={row.original.listingCount} />
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'channelCount',
        header: () => <div className="text-center">Channels</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <NumberCell value={row.original.channelCount} />
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.isActive ? 'success' : 'outline'}>
              {row.original.isActive ? 'Active' : 'Draft'}
            </Badge>
          </div>
        ),
        enableSorting: true,
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
                onClick: () => navigate(buildSlug(row.original.name, row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-org-catalogs',
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
        description="Price lists that decide what each sales channel sells, and for how much."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_CATALOGS.view}
        searchConfig={{ columns: [{ id: 'name', label: 'Name' }], searchAll: true }}
        filters={[
          <SelectFilter
            key="isActive"
            name="isActive"
            label="Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Draft', value: 'false' },
            ]}
          />,
          <SelectFilter
            key="taxInclusive"
            name="taxInclusive"
            label="Prices"
            options={[
              { label: 'Tax inclusive', value: 'true' },
              { label: 'Tax exclusive', value: 'false' },
            ]}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_CATALOGS.add}
            >
              Add Catalog
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: BookOpen,
          title: 'No catalogs yet',
          description: `A catalog holds the ${pluralize('listing', 2)} a channel sells. Create one, then add variants to it.`,
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open} permission={ORG_CATALOGS.add}>
              Add Catalog
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={BookOpen}
        title="Add Catalog"
        description="Tax treatment is set per catalog — retail sells inclusive of tax, wholesale exclusive."
        content={(close) => <AddCatalogDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
