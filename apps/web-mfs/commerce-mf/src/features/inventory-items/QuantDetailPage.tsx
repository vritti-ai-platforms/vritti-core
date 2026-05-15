import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInventoryItemQuant } from '@/hooks/inventory-item-quants';
import type { InventoryItemQuantStatus } from '@/schemas/inventory-item-quants';

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
          quant.locationPath
            ? `${quant.locationPath} › ${quant.locationName ?? ''}`
            : (quant.locationName ?? '—')
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
                    value={
                      quant.locationPath
                        ? `${quant.locationPath} › ${quant.locationName ?? ''}`
                        : quant.locationName
                    }
                  />
                  <DetailField label="Lot Number" value={quant.lotNumber} number />
                  <DetailField label="Quantity" value={quant.quantity} number />
                  <DetailField label="Reserved" value={quant.reservedQuantity} number />
                  <DetailField
                    label="Available"
                    value={<span className="text-success">{quant.availableQuantity}</span>}
                    number
                  />
                  <DetailField
                    label="Status"
                    value={<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>}
                  />
                  <DetailField label="Manufacturing Date" value={quant.manufacturingDate} dateOnly />
                  <DetailField label="Expiry Date" value={quant.expiryDate} dateOnly />
                  <DetailField label="Created" value={quant.createdAt} />
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
