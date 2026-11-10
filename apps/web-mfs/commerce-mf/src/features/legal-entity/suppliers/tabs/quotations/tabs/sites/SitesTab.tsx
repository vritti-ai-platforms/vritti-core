import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
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
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { QuotationSlotProps } from '@/components/suppliers/types';
import { SUPPLIER_QUOTATION_KEY, useRemoveSupplierQuotationFromSite } from '@/hooks/legal-entity/supplier-quotations';
import type { SupplierQuotationSiteData } from '@/schemas/supplier-quotations';
import { PostQuotationSiteDialog } from './forms/PostQuotationSiteDialog';

// The sites the quotation is posted to: posting writes a site's prices, removing it takes them back
export const SitesTab: React.FC<QuotationSlotProps> = ({ supplierId, quotation }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const postDialog = useDialog();
  const removeMutation = useRemoveSupplierQuotationFromSite(supplierId, quotation.id);
  const hasNoLines = quotation.items.length === 0;

  const handleRemove = useCallback(
    async (site: SupplierQuotationSiteData) => {
      const ok = await confirm({
        title: site.siteId ? `Remove from ${site.siteName ?? site.siteCode ?? 'this site'}?` : 'Remove from all sites?',
        description: site.siteId
          ? "The quotation's prices are deleted from the site, even those already in effect, and the prices they replaced apply again."
          : "The quotation's prices for all sites are deleted, even those already in effect, and the prices they replaced apply again.",
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
        cell: ({ row }) =>
          row.original.siteId ? (
            <StringCell value={row.original.siteName ?? row.original.siteCode} />
          ) : (
            <Badge variant="outline">All sites</Badge>
          ),
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
                label: row.original.siteId ? 'Remove from Site' : 'Remove from All Sites',
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

  const quotationSitesTable = useDataTable({
    columns,
    query: { data: { result: quotation.sites, count: quotation.sites.length } },
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
      disabled={hasNoLines}
      disabledTip="Add lines before posting the quotation"
    >
      Post to Site
    </Button>
  );

  return (
    <>
      <DataTable
        table={quotationSitesTable}
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
