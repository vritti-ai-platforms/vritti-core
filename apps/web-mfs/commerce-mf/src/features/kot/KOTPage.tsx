import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Typography } from '@vritti/quantum-ui/Typography';
import { groupBy } from 'lodash';
import { useMemo } from 'react';
import { useCommerceContext } from '../../context/CommerceContext';
import { useKotItems, useUpdateKotItemStatus } from '../../hooks';
import type { KotItem } from '../../schemas';

// Maps item status to the next action
function getNextStatus(status: string): { label: string; status: string } | null {
  switch (status) {
    case 'PENDING':
      return { label: 'Start', status: 'PREPARING' };
    case 'PREPARING':
      return { label: 'Ready', status: 'READY' };
    default:
      return null;
  }
}

// Maps status to badge variant
function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'READY':
      return 'default';
    case 'PREPARING':
      return 'secondary';
    default:
      return 'outline';
  }
}

export const KOTPage = () => {
  const { businessUnitId } = useCommerceContext();
  const { data: kotItems = [], isLoading } = useKotItems(businessUnitId);
  const updateStatusMutation = useUpdateKotItemStatus();

  // Group items by station
  const groupedByStation = useMemo(() => {
    return groupBy(kotItems, (item: KotItem) => item.stationName ?? 'Unassigned');
  }, [kotItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const stationNames = Object.keys(groupedByStation);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kitchen Display"
        description="Live KOT items grouped by station (auto-refreshes every 10s)"
      />

      {stationNames.length === 0 ? (
        <div className="text-center py-16">
          <Typography intent="muted">No active KOT items</Typography>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stationNames.map((stationName) => (
            <div key={stationName} className="space-y-4">
              <Typography variant="h4">{stationName}</Typography>
              {groupedByStation[stationName].map((item: KotItem) => {
                const nextAction = getNextStatus(item.status);
                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Typography className="font-medium">{item.name}</Typography>
                        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Typography intent="muted" variant="caption">Qty: {item.quantity}</Typography>
                        {item.kotNumber && (
                          <Typography intent="muted" variant="caption">KOT #{item.kotNumber}</Typography>
                        )}
                      </div>
                      {item.notes && (
                        <Typography intent="muted" variant="caption" className="italic">{item.notes}</Typography>
                      )}
                      {nextAction && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          isLoading={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              itemId: item.id,
                              status: nextAction.status,
                            })
                          }
                        >
                          {nextAction.label}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
