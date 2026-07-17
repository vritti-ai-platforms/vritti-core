import { useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Building2, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPANIES_TABLE_KEY, useCompaniesTable } from '@/hooks/organization/companies';
import type { CompanyData } from '@/schemas/companies';
import { AddCompanyDialog } from './forms/AddCompanyDialog';

export const CompaniesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useCompaniesTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<CompanyData>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'legalName',
        header: 'Legal Name',
        cell: ({ row }) => <StringCell value={row.original.legalName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'jurisdictionName',
        header: 'Jurisdiction',
        cell: ({ row }) => <StringCell value={row.original.jurisdictionName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
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
                onClick: () => navigate(buildSlug(row.original.displayName, row.original.id)),
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
    slug: 'commerce-org-companies',
    label: 'company',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: COMPANIES_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Companies"
        description="Organizations you do business with — customers, suppliers, and more."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_COMPANIES.view}
        onRowClick={(row) => navigate(buildSlug(row.displayName, row.id))}
        searchConfig={{
          columns: [{ id: 'displayName', label: 'Name' }],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={ORG_COMPANIES.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Company
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Building2,
          title: 'No companies',
          description: 'Add your first company — an organization you do business with.',
          action: (
            <Button
              permission={ORG_COMPANIES.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Company
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Building2}
        title="Add Company"
        description="Create a new organization you do business with."
        className="max-w-3xl"
        content={(close) => <AddCompanyDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
