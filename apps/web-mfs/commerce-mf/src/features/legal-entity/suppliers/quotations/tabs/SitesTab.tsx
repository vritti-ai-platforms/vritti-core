import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Building2, Send, Undo2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { SUPPLIER_QUOTATION_KEY, useRemoveSupplierQuotationFromSite } from '@/hooks/legal-entity/supplier-quotations';
import type { SupplierQuotationDetail, SupplierQuotationSiteData } from '@/schemas/supplier-quotations';
import { PostQuotationSiteDialog } from '../forms/PostQuotationSiteDialog';

interface SitesTabProps {
  supplierId: string;
  quotation: SupplierQuotationDetail;
}

export const SitesTab = ({ supplierId, quotation }: SitesTabProps) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const postDialog = useDialog();
  const removeMutation = useRemoveSupplierQuotationFromSite(supplierId, quotation.id);
  const noLinesTip = quotation.items.length === 0 ? 'Add lines before posting the quotation' : undefined;

  const handleRemove = useCallback(
    async (site: SupplierQuotationSiteData) => {
      const ok = await confirm({
        title: `Remove from ${site.siteName ?? site.siteCode ?? 'this site'}?`,
        description:
          "The quotation's prices are deleted from the site, even those already in effect, and the prices they replaced apply again.",
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) removeMutation.mutate(site.siteId);
    },
    [confirm, removeMutation],
  );

  const columns = useMemo<ColumnDef<SupplierQuotationSiteData>[]>(
    () => [
      {
        accessorKey: 'siteName',
        header: 'Site',
        cell: ({ row }) => <StringCell value={row.original.siteName ?? row.original.siteCode} />,
      },
      { accessorKey: 'siteCode', header: 'Code', cell: ({ row }) => <StringCell value={row.original.siteCode} mono /> },
      { accessorKey: 'postedAt', header: 'Posted', cell: ({ row }) => <DateTimeCell value={row.original.postedAt} /> },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'remove',
                icon: Undo2,
                label: 'Remove from Site',
                variant: 'destructive',
                permission: LE_SUPPLIERS.sites.quotations.delete,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [handleRemove],
  );

  const { table } = useDataTable({
    columns,
    serverState: { result: quotation.sites, count: quotation.sites.length },
    slug: 'commerce-supplier-quotation-sites',
    label: 'site',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_QUOTATION_KEY(supplierId, quotation.id) }),
  });

  const postButton = (
    <Button
      size="sm"
      permission={LE_SUPPLIERS.sites.quotations.add}
      startAdornment={<Send className="size-4" />}
      onClick={postDialog.open}
      disabled={!!noLinesTip}
      disabledTip={noLinesTip}
    >
      Post to Site
    </Button>
  );

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        permission={LE_SUPPLIERS.quotations.view}
        toolbarActions={{ actions: postButton }}
        emptyStateConfig={{
          icon: Building2,
          title: 'Not posted yet',
          description: "Post the quotation to a site to make its lines that site's prices from the start date.",
          action: postButton,
        }}
      />
      <Dialog
        handle={postDialog}
        icon={Send}
        title="Post to Site"
        description="The supplier must be enrolled at the site. Items the supplier or the site does not have yet are added."
        content={(close) => (
          <PostQuotationSiteDialog
            supplierId={supplierId}
            quotationId={quotation.id}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
