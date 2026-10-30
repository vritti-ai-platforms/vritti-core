import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Building2, Eye, Pencil, Plus, UserPlus } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SUPPLIER_SITES_TABLE_KEY, useSupplierSitesTable } from '@/hooks/legal-entity/suppliers';
import { SITE_ENROLLMENT_STATUS_OPTIONS } from '@/schemas/site-suppliers';
import type { SupplierSiteRow } from '@/schemas/suppliers';
import { AddSupplierSiteDialog } from '../forms/AddSupplierSiteDialog';
import { EditSupplierSiteDialog } from '../forms/EditSupplierSiteDialog';

function sitePath(row: SupplierSiteRow): string {
  return row.siteId;
}

interface SitesTabProps {
  supplierId: string;
  partyId: string;
  defaultPaymentTermId: string | null;
}

export const SitesTab: React.FC<SitesTabProps> = ({ supplierId, partyId, defaultPaymentTermId }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { detail: tab } = useParams();
  // A tab URL (…/<supplier>/items) has a segment to climb out of before a child path; the bare detail URL has none
  const fromTab = useCallback((target: string) => (tab ? `../${target}` : target), [tab]);
  const addDialog = useDialog();
  const { data: response, isLoading } = useSupplierSitesTable(supplierId);

  const columns = useMemo<ColumnDef<SupplierSiteRow>[]>(
    () => [
      {
        accessorKey: 'siteName',
        header: 'Site',
        cell: ({ row }) => <StringCell value={row.original.siteName ?? row.original.siteCode} />,
        enableSorting: true,
      },
      {
        accessorKey: 'siteCode',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.siteCode} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'enrollmentStatus',
        header: 'Enrollment Status',
        cell: ({ row }) =>
          row.original.enrollmentStatus === 'ENROLLED' ? (
            <Badge variant="success">Enrolled</Badge>
          ) : (
            <Badge variant="outline">Not Enrolled</Badge>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'paymentTermName',
        header: 'Payment Term',
        cell: ({ row }) => <StringCell value={row.original.paymentTermName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'registrationNumber',
        header: 'Tax Registration',
        cell: ({ row }) => <StringCell value={row.original.registrationNumber} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'bankAccountName',
        header: 'Branch Bank',
        cell: ({ row }) => <StringCell value={row.original.bankAccountName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'orderContactName',
        header: 'Order Contact',
        enableSorting: false,
        cell: ({ row }) => <StringCell value={row.original.orderContactName ?? row.original.orderContactLabel} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const site = row.original;
          const enrollmentId = site.id;
          return (
            <RowActions
              actions={[
                {
                  id: 'view',
                  icon: Eye,
                  label: 'View',
                  permission: LE_SUPPLIERS.sites.view,
                  onClick: () => navigate(fromTab(sitePath(site)), { relative: 'path' }),
                },
                enrollmentId
                  ? {
                      id: 'edit',
                      icon: Pencil,
                      label: 'Edit',
                      permission: LE_SUPPLIERS.sites.editEnroll,
                      dialog: {
                        title: 'Edit Site Enrollment',
                        description: 'Update the payment term, tax registration, bank account and order contact.',
                        content: (close) => (
                          <EditSupplierSiteDialog
                            supplierId={supplierId}
                            partyId={partyId}
                            site={site}
                            enrollmentId={enrollmentId}
                            onSuccess={close}
                            onCancel={close}
                          />
                        ),
                      },
                    }
                  : {
                      id: 'enroll',
                      icon: UserPlus,
                      label: 'Enroll Supplier',
                      permission: LE_SUPPLIERS.sites.enroll,
                      dialog: {
                        title: 'Enroll Supplier',
                        description: `Choose the payment term, tax registration, bank account and order contact for ${site.siteName ?? site.siteCode ?? 'the site'}.`,
                        content: (close) => (
                          <AddSupplierSiteDialog
                            supplierId={supplierId}
                            partyId={partyId}
                            defaultPaymentTermId={defaultPaymentTermId}
                            siteId={site.siteId}
                            onSuccess={close}
                            onCancel={close}
                          />
                        ),
                      },
                    },
              ]}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [supplierId, partyId, defaultPaymentTermId, navigate, fromTab],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-supplier-${supplierId}-sites`,
    label: 'site',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_SITES_TABLE_KEY(supplierId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={LE_SUPPLIERS.sites.view}
        searchConfig={{
          columns: [
            { id: 'siteName', label: 'Site' },
            { id: 'siteCode', label: 'Code' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="enrollmentStatus"
            name="enrollmentStatus"
            label="Enrollment Status"
            options={SITE_ENROLLMENT_STATUS_OPTIONS}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={LE_SUPPLIERS.sites.enroll}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Enroll Supplier
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Building2,
          title: 'No sites',
          description: 'The legal entity has no sites yet.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Building2}
        title="Enroll Supplier"
        description="Choose the site, payment term, tax registration, bank account and order contact."
        content={(close) => (
          <AddSupplierSiteDialog
            supplierId={supplierId}
            partyId={partyId}
            defaultPaymentTermId={defaultPaymentTermId}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
