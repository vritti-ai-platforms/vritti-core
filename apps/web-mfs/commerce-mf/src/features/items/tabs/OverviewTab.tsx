import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { ItemDetail } from '@/schemas/items';

interface OverviewTabProps {
  item: ItemDetail;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Typography variant="overline" intent="muted">{label}</Typography>
      <div className="text-sm font-medium">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ item }) => {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <InfoRow label="Name" value={item.name} />
            <InfoRow label="Code" value={<span className="font-mono">{item.code}</span>} />
            <InfoRow label="Type" value={
              <Badge variant="secondary" className={item.type === 'PRODUCT' ? 'bg-primary/10 text-primary' : 'bg-accent/50 text-accent-foreground'}>
                {item.type === 'PRODUCT' ? 'Product' : 'Service'}
              </Badge>
            } />
            <InfoRow label="Category" value={item.categoryName ? <Badge variant="outline">{item.categoryName}</Badge> : null} />
            <InfoRow label="Description" value={item.description} />
            <InfoRow label="Status" value={
              <Badge variant={item.isAvailable ? 'secondary' : 'outline'} className={item.isAvailable ? 'bg-success/15 text-success' : ''}>
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            } />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Tax</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <InfoRow label="Base Price" value={<span className="font-mono">{Number.parseFloat(item.basePrice).toFixed(2)}</span>} />
            <InfoRow label="Tax Group" value={item.taxGroupId ? 'Assigned' : null} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
