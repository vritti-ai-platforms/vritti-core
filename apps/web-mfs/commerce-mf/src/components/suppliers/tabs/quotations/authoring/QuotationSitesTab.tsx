import { useQueryClient } from '@tanstack/react-query';
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
import type { QuotationPostingBinding, QuotationSlotProps } from '@/components/suppliers/bindings';
import type { SupplierQuotationSiteData } from '@/schemas/supplier-quotations';
import { PostQuotationSiteDialog } from './forms/PostQuotationSiteDialog';

type PostingSlotProps<TTo extends QuotationPostingBinding['to']> = QuotationSlotProps & {
  posting: Extract<QuotationPostingBinding, { to: TTo }>;
};

// The sites the quotation is posted to: posting writes a site's prices, removing it takes them back
export const QuotationSitesTab: React.FC<QuotationSlotProps> = (props) => {
  const posting = props.authoring.posting;
  return posting.to === 'anySite' ? (
    <AnySitePostings {...props} posting={posting} />
  ) : (
    <OwnSitePostings {...props} posting={posting} />
  );
};

// The legal entity posts to any enrolled site, or to none for all its sites, and removes any posting
const AnySitePostings: React.FC<PostingSlotProps<'anySite'>> = ({ posting, ...props }) => {
  const { supplierId, quotation } = props;
  const postDialog = useDialog();
  const removeMutation = posting.useRemove(supplierId, quotation.id);

  const postButton = (
    <Button
      size="sm"
      permission={posting.permissions.post}
      startAdornment={<Send className="size-4" />}
      onClick={postDialog.open}
      disabled={quotation.items.length === 0}
      disabledTip="Add lines before posting the quotation"
    >
      Post to Site
    </Button>
  );

  return (
    <>
      <PostingsTable
        {...props}
        removePermission={posting.permissions.remove}
        onRemove={(site) => removeMutation.mutate(site.siteId)}
        postButton={postButton}
        emptyDescription="Post the quotation to a site to make its lines that site's prices from the start date."
      />
      <Dialog
        handle={postDialog}
        icon={Send}
        title="Post to Site"
        description="The supplier must be enrolled at the site. Items the supplier or the site does not have yet are added."
        content={(close) => (
          <PostQuotationSiteDialog
            usePost={posting.usePost}
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

// A site posts its own quotation to itself, and removes whatever is posted to it
const OwnSitePostings: React.FC<PostingSlotProps<'ownSite'>> = ({ posting, ...props }) => {
  const { supplierId, quotation } = props;
  const confirm = useConfirm();
  const postMutation = posting.usePost(supplierId, quotation.id);
  const removeMutation = posting.useRemove(supplierId, quotation.id);
  const isPostedHere = quotation.sites.some((site) => site.siteId === quotation.siteId);

  const handlePost = useCallback(async () => {
    const ok = await confirm({
      title: `Post quotation "${quotation.quotationNumber}"?`,
      description: "Its lines become this site's prices from its start date and are fixed from then on.",
      confirmLabel: 'Post',
    });
    if (ok) postMutation.mutate();
  }, [confirm, postMutation, quotation.quotationNumber]);

  const postButton = (
    <Button
      size="sm"
      permission={posting.permissions.post}
      startAdornment={<Send className="size-4" />}
      onClick={handlePost}
      isLoading={postMutation.isPending}
      disabled={!quotation.canWrite || isPostedHere || quotation.items.length === 0}
      disabledTip={
        !quotation.canWrite
          ? `Owned by ${quotation.ownerName}`
          : isPostedHere
            ? 'Already posted to this site'
            : 'Add lines before posting the quotation'
      }
    >
      Post to This Site
    </Button>
  );

  return (
    <PostingsTable
      {...props}
      removePermission={posting.permissions.remove}
      onRemove={() => removeMutation.mutate()}
      postButton={postButton}
      emptyDescription="Post the quotation to make its lines this site's prices from the start date."
    />
  );
};

interface PostingsTableProps extends QuotationSlotProps {
  removePermission: string;
  onRemove: (site: SupplierQuotationSiteData) => void;
  postButton: React.ReactNode;
  emptyDescription: string;
}

const PostingsTable: React.FC<PostingsTableProps> = ({
  binding,
  supplierId,
  quotation,
  removePermission,
  onRemove,
  postButton,
  emptyDescription,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const handleRemove = useCallback(
    async (site: SupplierQuotationSiteData) => {
      const ok = await confirm({
        title: site.siteId ? `Remove from ${site.siteName}?` : 'Remove from all sites?',
        description: site.siteId
          ? "The quotation's prices are deleted from the site, even those already in effect, and the prices they replaced apply again."
          : "The quotation's prices for all sites are deleted, even those already in effect, and the prices they replaced apply again.",
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) onRemove(site);
    },
    [confirm, onRemove],
  );

  const columns = useMemo<ColumnDef<SupplierQuotationSiteData>[]>(
    () => [
      {
        accessorKey: 'siteName',
        header: 'Site',
        cell: ({ row }) =>
          row.original.siteId ? (
            <StringCell value={row.original.siteName} />
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
                permission: removePermission,
                disabled: !row.original.canRemove,
                disabledTip: row.original.siteId
                  ? `Only ${row.original.siteName} or the legal entity removes it`
                  : 'Only the legal entity removes it',
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [handleRemove, removePermission],
  );

  const quotationSitesTable = useDataTable({
    columns,
    query: { data: { result: quotation.sites, count: quotation.sites.length } },
    slug: 'commerce-supplier-quotation-sites',
    label: 'site',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.quotationKey(supplierId, quotation.id) }),
  });

  return (
    <DataTable
      table={quotationSitesTable}
      mode="tab"
      permission={binding.permissions.view}
      toolbarActions={{ actions: postButton }}
      emptyStateConfig={{ icon: Building2, title: 'Not posted yet', description: emptyDescription, action: postButton }}
    />
  );
};
