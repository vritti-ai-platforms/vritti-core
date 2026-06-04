import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useConversion } from '@/hooks/conversions';
import type { ConversionStatus } from '@/schemas/conversions';
import { CompleteConversionDialog } from './forms/CompleteConversionDialog';

const statusConfig: Record<
  ConversionStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  IN_PROGRESS: { label: 'In Progress', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  COMPLETED: { label: 'Completed', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const ConversionDetailPage = () => {
  const { id } = useSlugParams('conversionSlug');
  const { data: conversion, isLoading, refetch } = useConversion(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const completeDialog = useDialog();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!conversion) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Conversion not found.</div>;
  }

  const badgeConfig = statusConfig[conversion.status];
  const canComplete = conversion.status === 'IN_PROGRESS';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Conversion ${conversion.id.slice(0, 8)}`}
        description={conversion.bomName ?? 'Manual Conversion'}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
              {badgeConfig.label}
            </Badge>
            {canComplete && (
              <Button size="sm" startAdornment={<CheckCircle className="size-4" />} onClick={completeDialog.open}>
                Complete
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <DetailField label="BOM" type="string" value={conversion.bomName} />
                  <DetailField
                    label="Status"
                    type="string"
                    value={
                      <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
                        {badgeConfig.label}
                      </Badge>
                    }
                  />
                  <DetailField label="Produced By" type="string" value={conversion.producedBy} />
                  <DetailField label="Started At" type="dateTime" value={conversion.startedAt} />
                  <DetailField label="Completed At" type="dateTime" value={conversion.completedAt} />
                  <DetailField label="Notes" type="string" value={conversion.notes} className="col-span-2" />
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'inputs',
            label: `Inputs (${conversion.inputs.length})`,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Inputs</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversion.inputs.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">No input items.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">#</th>
                            <th className="pb-2 font-medium">Inventory Item</th>
                            <th className="pb-2 font-medium text-right">Quantity</th>
                            <th className="pb-2 font-medium text-right">Wastage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversion.inputs.map((input, index) => (
                            <tr key={input.id} className="border-b last:border-0">
                              <td className="py-3 text-muted-foreground">{index + 1}</td>
                              <td className="py-3 font-medium">{input.inventoryItemName ?? input.inventoryItemId}</td>
                              <td className="py-3 text-right font-mono">{input.quantity}</td>
                              <td className="py-3 text-right font-mono">{input.wastageQuantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'outputs',
            label: `Outputs (${conversion.outputs.length})`,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Outputs</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversion.outputs.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">No output items.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">#</th>
                            <th className="pb-2 font-medium">Inventory Item</th>
                            <th className="pb-2 font-medium text-right">Quantity</th>
                            <th className="pb-2 font-medium text-right">Wastage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversion.outputs.map((output, index) => (
                            <tr key={output.id} className="border-b last:border-0">
                              <td className="py-3 text-muted-foreground">{index + 1}</td>
                              <td className="py-3 font-medium">{output.inventoryItemName ?? output.inventoryItemId}</td>
                              <td className="py-3 text-right font-mono">{output.quantity}</td>
                              <td className="py-3 text-right font-mono">{output.wastageQuantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={completeDialog}
        title="Complete Conversion"
        description="Select the storage location where the conversion output will be stored."
        content={(close) => (
          <CompleteConversionDialog
            conversionId={conversion.id}
            onSuccess={() => {
              close();
              refetch();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
