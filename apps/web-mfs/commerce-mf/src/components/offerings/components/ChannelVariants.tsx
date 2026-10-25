import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { FilePlus, Package, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { ChannelVariantData } from '@/schemas/offerings';
import { AddChannelPagesDialog } from '../forms/AddChannelPagesDialog';
import type {
  OfferingPermissions,
  UseCreateOfferingChannelPages,
  UseOfferingAttributes,
  UseOfferingChannelVariantsTable,
  UseOfferingDimensions,
  UseSetOfferingTargetAvailability,
} from '../types';
import { facetFilters } from './facetFilters';

interface ChannelVariantsProps {
  offeringId: string;
  channelType: string;
  targetId: string;
  permissions: OfferingPermissions;
  useOfferingChannelVariantsTable: UseOfferingChannelVariantsTable;
  useOfferingDimensions: UseOfferingDimensions;
  useOfferingAttributes: UseOfferingAttributes;
  useCreateOfferingChannelPages: UseCreateOfferingChannelPages;
  useSetOfferingTargetAvailability: UseSetOfferingTargetAvailability;
  variantsKey: (offeringId: string, targetId: string) => readonly unknown[];
  variantsSlug: (offeringId: string, targetId: string) => string;
}

// One channel's view of this offering: a row per variant saying whether the channel carries it, whether it
// is available there, and — where the channel names a storefront — whether a page exists and is finished.
export const ChannelVariants: React.FC<ChannelVariantsProps> = ({
  offeringId,
  channelType,
  targetId,
  permissions,
  useOfferingChannelVariantsTable,
  useOfferingDimensions,
  useOfferingAttributes,
  useCreateOfferingChannelPages,
  useSetOfferingTargetAvailability,
  variantsKey,
  variantsSlug,
}) => {
  const { data: response, isLoading } = useOfferingChannelVariantsTable(offeringId, channelType, targetId);
  const { data: dimensions = [] } = useOfferingDimensions(offeringId);
  const { data: attributes = [] } = useOfferingAttributes(offeringId);
  const queryClient = useQueryClient();
  const addDialog = useDialog();
  const createPages = useCreateOfferingChannelPages();
  const setAvailability = useSetOfferingTargetAvailability();
  const storefront = response?.storefront ?? false;
  const catalogName = response?.catalogName ?? '';
  // A channel a wider workspace set is read-only here, the way the channels screen treats an inherited one
  const canSetAvailability = response?.isOwn ?? false;

  const create = useCallback(
    (variantCodes: string[]) => createPages.mutate({ offeringId, channelType, targetId, variantCodes }),
    [createPages, offeringId, channelType, targetId],
  );

  const columns = useMemo<ColumnDef<ChannelVariantData>[]>(
    () => [
      getSelectionColumn<ChannelVariantData>(),
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      {
        id: 'combination',
        header: 'Combination',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.values.map((value) => value.value).join(' · ')}</span>
        ),
        enableSorting: false,
      },
      {
        id: 'availableHere',
        // Named, because availability is set on the catalog the channel carries rather than on the channel
        header: () => <div className="text-center">{catalogName ? `Available in ${catalogName}` : 'Available'}</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {/* Off has two causes and the reader can act on only one of them, so the switch refuses to be
                flipped where the catalog carries nothing to make available */}
            <StatusSwitch
              checked={row.original.availableHere}
              tone={row.original.listed ? 'success' : 'warning'}
              activeLabel="Available"
              inactiveLabel="Excluded"
              permission={permissions.channels.setAvailability}
              disabled={!row.original.listed || !canSetAvailability}
              disabledTip={
                row.original.listed
                  ? 'This channel was set by a wider workspace. Change it where it was set.'
                  : `${catalogName || 'This catalog'} does not list this variant.`
              }
              isLoading={setAvailability.isPending}
              onCheckedChange={(availableHere) =>
                setAvailability.mutate({
                  offeringId,
                  channelType,
                  targetId,
                  variantId: row.original.id,
                  availableHere,
                })
              }
              ariaLabel={`Set availability of ${row.original.code} on this channel`}
            />
          </div>
        ),
        enableSorting: false,
      },
      ...(storefront
        ? [
            {
              id: 'page',
              header: () => <div className="text-center">Page</div>,
              cell: ({ row }: { row: { original: ChannelVariantData } }) => (
                <div className="flex justify-center">{pageStatus(row.original)}</div>
              ),
              enableSorting: false,
            },
          ]
        : []),
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const actions: RowAction[] = [
            {
              id: 'create',
              icon: FilePlus,
              label: 'Create page',
              permission: permissions.channels.createPage,
              // Only where the storefront answered and said it has none — an unknown is not a thing to act on
              hidden: !storefront || row.original.exists !== false,
              onClick: () => create([row.original.code]),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      permissions,
      create,
      storefront,
      catalogName,
      canSetAvailability,
      setAvailability,
      offeringId,
      channelType,
      targetId,
    ],
  );

  const { table } = useDataTable({
    columns,
    slug: variantsSlug(offeringId, targetId),
    label: 'variant',
    serverState: response,
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: variantsKey(offeringId, targetId) }),
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        searchConfig={{ columns: [{ id: 'code', label: 'Code' }], searchAll: true }}
        filters={[...facetFilters('dimension', dimensions), ...facetFilters('attribute', attributes)]}
        toolbarActions={{
          actions: storefront ? (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              permission={permissions.channels.createPage}
              onClick={addDialog.open}
            >
              Add Page
            </Button>
          ) : null,
        }}
        selectActions={(selected) => {
          if (!storefront) return null;

          // A selection can hold rows that already have pages; only the missing ones are offered
          const missing = selected.filter((row) => row.original.exists === false).map((row) => row.original.code);
          if (missing.length === 0) return null;

          return (
            <Button
              size="sm"
              variant="outline"
              permission={permissions.channels.createPage}
              isLoading={createPages.isPending}
              loadingText="Creating..."
              startAdornment={<FilePlus className="size-4" />}
              onClick={() => create(missing)}
            >
              {`Create ${pluralize('page', missing.length, true)}`}
            </Button>
          );
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No variants yet',
          description: 'Generate this offering’s variants first; their listings follow.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={FilePlus}
        title="Add storefront pages"
        description="Name the variants this channel’s storefront should have a page for."
        content={(close) => (
          <AddChannelPagesDialog
            offeringId={offeringId}
            channelType={channelType}
            targetId={targetId}
            useCreateOfferingChannelPages={useCreateOfferingChannelPages}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};

function pageStatus(row: ChannelVariantData) {
  if (row.exists === null) return <Badge variant="outline">Unknown</Badge>;
  if (!row.exists) return <Badge variant="destructive">No page</Badge>;
  return row.metadataComplete ? <Badge variant="success">Ready</Badge> : <Badge variant="warning">Not ready</Badge>;
}
