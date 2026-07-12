import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { InventoryItemQuantStatus } from '@/schemas/inventory-item-quants';
import { useInventoryItemQuant } from '@/site/hooks/inventory-item-quants';

function getQuantStatus(expiryDate: string | null): InventoryItemQuantStatus {
  if (!expiryDate) return 'FRESH';
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'FRESH';
}

const STATUS_CONFIG: Record<
  InventoryItemQuantStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'secondary' },
  FRESH: { label: 'Fresh', variant: 'default' },
};

export const QuantDetailPage = () => {
  const { quantId } = useParams<{ quantId: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: quant, isLoading } = useInventoryItemQuant(quantId ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!quant) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Quant not found.</div>;
  }

  const status = getQuantStatus(quant.expiryDate);
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={quant.lotNumber ? `Quant · Lot ${quant.lotNumber}` : 'Quant'}
        description={
          quant.locationPath ? `${quant.locationPath} › ${quant.locationName ?? ''}` : (quant.locationName ?? '—')
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
                  <CardTitle>Quant Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <DetailField
                    label="Location"
                    type="string"
                    value={
                      quant.locationPath ? `${quant.locationPath} › ${quant.locationName ?? ''}` : quant.locationName
                    }
                  />
                  <DetailField label="Lot Number" type="string" mono value={quant.lotNumber} />
                  <DetailField label="Quantity" type="number" value={quant.quantity} />
                  <DetailField label="Reserved" type="number" value={quant.reservedQuantity} />
                  <DetailField
                    label="Available"
                    type="string"
                    mono
                    value={<span className="text-success">{quant.availableQuantity}</span>}
                  />
                  <DetailField
                    label="Status"
                    type="string"
                    value={<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
                  />
                  <DetailField label="Manufacturing Date" type="date" value={quant.manufacturingDate} />
                  <DetailField label="Expiry Date" type="date" value={quant.expiryDate} />
                  <DetailField label="Created" type="dateTime" value={quant.createdAt} />
                </CardContent>
              </Card>
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
    </div>
  );
};
