import { useQueryClient } from '@tanstack/react-query';
import { ORG_TAX_JURISDICTIONS } from '@vritti/commerce-permissions/tax-jurisdictions';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailHeader, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Eye, Map, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  TAX_JURISDICTION_CHILDREN_TABLE_KEY,
  useDeleteTaxJurisdiction,
  useTaxJurisdictionById,
  useTaxJurisdictionChildrenTable,
} from '@/hooks/organization/tax-jurisdictions';
import { LEVEL_LABELS, type TaxJurisdictionData } from '@/schemas/tax-jurisdictions';
import { AddJurisdictionDialog } from '../forms/AddJurisdictionDialog';
import { EditJurisdictionDialog } from '../forms/EditJurisdictionDialog';
import { JurisdictionDetailPanelSkeleton } from './JurisdictionDetailPanelSkeleton';

interface JurisdictionDetailPanelProps {
  jurisdictionId: string | null;
  onSelectJurisdiction: (id: string | null) => void;
}

export const JurisdictionDetailPanel: React.FC<JurisdictionDetailPanelProps> = ({
  jurisdictionId,
  onSelectJurisdiction,
}) => {
  const { data: jurisdiction, isLoading } = useTaxJurisdictionById(jurisdictionId);

  return (
    <PageContentDetails
      className="flex flex-col"
      isLoading={!!jurisdictionId && (isLoading || !jurisdiction)}
      loadingContent={<JurisdictionDetailPanelSkeleton />}
      isEmpty={!jurisdictionId}
      emptyState={
        <Empty
          icon={<Map />}
          title="Select a jurisdiction"
          description="Click a jurisdiction in the tree to view its details"
        />
      }
    >
      {jurisdiction ? (
        <JurisdictionDetailContent jurisdiction={jurisdiction} onSelectJurisdiction={onSelectJurisdiction} />
      ) : null}
    </PageContentDetails>
  );
};

interface JurisdictionDetailContentProps {
  jurisdiction: TaxJurisdictionData;
  onSelectJurisdiction: (id: string | null) => void;
}

const JurisdictionDetailContent: React.FC<JurisdictionDetailContentProps> = ({
  jurisdiction,
  onSelectJurisdiction,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addChildDialog = useDialog();
  const editDialog = useDialog();
  const deleteMutation = useDeleteTaxJurisdiction();
  const { data: childrenResponse, isLoading: isChildrenLoading } = useTaxJurisdictionChildrenTable(jurisdiction.id);

  const columns = useMemo<ColumnDef<TaxJurisdictionData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => <Badge variant="outline">{LEVEL_LABELS[row.original.level]}</Badge>,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => onSelectJurisdiction(row.original.id) }]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onSelectJurisdiction],
  );

  const { table } = useDataTable({
    columns,
    serverState: childrenResponse,
    slug: `commerce-org-tax-jurisdiction-${jurisdiction.id}-children`,
    label: 'child jurisdiction',
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_JURISDICTION_CHILDREN_TABLE_KEY(jurisdiction.id) }),
  });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${jurisdiction.name}"?`,
      description: 'This jurisdiction will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(jurisdiction.id, {
        onSuccess: () => onSelectJurisdiction(jurisdiction.parentId),
      });
    }
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title={jurisdiction.name}
        badges={
          <>
            <Badge
              variant={jurisdiction.isActive ? 'secondary' : 'outline'}
              className={jurisdiction.isActive ? 'bg-success/15 text-success' : ''}
            >
              {jurisdiction.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">{LEVEL_LABELS[jurisdiction.level]}</Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={editDialog.open}
              startAdornment={<Pencil className="size-3.5" />}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!jurisdiction.canDelete || deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
              startAdornment={<Trash2 className="size-3.5" />}
            >
              Delete
            </Button>
          </>
        }
      />

      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSection wrap>
          <DetailField className="px-4 py-2" label="Code" type="string" value={jurisdiction.code} mono />
          <DetailField
            className="px-4 py-2"
            label="Level"
            type="string"
            value={LEVEL_LABELS[jurisdiction.level]}
          />
          <DetailField className="px-4 py-2" label="Country" type="string" value={jurisdiction.countryCode} />
          <DetailField className="px-4 py-2" label="Region Code" type="string" value={jurisdiction.regionCode} />
          <DetailField className="px-4 py-2" label="Tax Union" type="string" value={jurisdiction.taxUnion} />
          <DetailField className="px-4 py-2" label="Parent" type="string" value={jurisdiction.parentName} />
        </DetailSection>
      </div>

      <div>
        <Typography variant="overline" intent="muted" className="mb-3">
          Child Jurisdictions ({childrenResponse?.count ?? 0})
        </Typography>
        <DataTable
          table={table}
          mode="compact"
          isLoading={isChildrenLoading}
          permission={ORG_TAX_JURISDICTIONS.view}
          toolbarActions={{
            actions: (
              <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addChildDialog.open}>
                Add Child
              </Button>
            ),
          }}
          emptyStateConfig={{
            icon: Map,
            title: 'No child jurisdictions',
            description: 'This jurisdiction has no direct children.',
          }}
        />
      </div>

      <Dialog
        handle={addChildDialog}
        icon={Map}
        title="Add Child Jurisdiction"
        description={`Add a child jurisdiction under "${jurisdiction.name}".`}
        content={(close) => (
          <AddJurisdictionDialog
            defaultParentId={jurisdiction.id}
            defaultCountryCode={jurisdiction.countryCode}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: TAX_JURISDICTION_CHILDREN_TABLE_KEY(jurisdiction.id) });
              close();
            }}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={editDialog}
        icon={Map}
        title="Edit Jurisdiction"
        description="Update the details for this jurisdiction."
        content={(close) => <EditJurisdictionDialog jurisdiction={jurisdiction} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
