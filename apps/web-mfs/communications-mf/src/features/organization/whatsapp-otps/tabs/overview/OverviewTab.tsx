import { AreaChart, type ChartConfig } from '@vritti/quantum-ui/AreaChart';
import { Card } from '@vritti/quantum-ui/Card';
import { PieChart } from '@vritti/quantum-ui/PieChart';
import { useMemo } from 'react';
import { useWhatsappOtpStats } from '@/hooks/organization/whatsapp-otps';
import { StatStrip } from '../../components/StatStrip';
import { OverviewTabSkeleton } from './OverviewTabSkeleton';

// Both charts and the tiles run in lifecycle order — sent → delivered → read → verified, then failed
const TREND_CONFIG: ChartConfig = {
  sent: { label: 'Sent', color: 'var(--color-muted-foreground)' },
  delivered: { label: 'Delivered', color: 'var(--color-info)' },
  read: { label: 'Read', color: 'var(--color-primary)' },
  verified: { label: 'Verified', color: 'var(--color-success)' },
  failed: { label: 'Failed', color: 'var(--color-destructive)' },
};

// Semantic tokens rather than the chart palette: these slices mean something, and the colour should
// match the badge the same row carries in the Codes tab
const STATUS_CONFIG: ChartConfig = {
  sent: { label: 'Sent', color: 'var(--color-muted-foreground)' },
  delivered: { label: 'Delivered', color: 'var(--color-info)' },
  read: { label: 'Read', color: 'var(--color-primary)' },
  verified: { label: 'Verified', color: 'var(--color-success)' },
  failed: { label: 'Failed', color: 'var(--color-destructive)' },
};

export const OverviewTab = () => {
  const { data: stats, isLoading } = useWhatsappOtpStats();

  const statusData = useMemo(
    () => [
      { status: 'sent', count: stats?.sent ?? 0, fill: 'var(--color-muted-foreground)' },
      { status: 'delivered', count: stats?.delivered ?? 0, fill: 'var(--color-info)' },
      { status: 'read', count: stats?.read ?? 0, fill: 'var(--color-primary)' },
      { status: 'verified', count: stats?.verified ?? 0, fill: 'var(--color-success)' },
      { status: 'failed', count: stats?.failed ?? 0, fill: 'var(--color-destructive)' },
    ],
    [stats],
  );

  if (isLoading || !stats) return <OverviewTabSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <StatStrip
        items={[
          { label: 'Total', value: stats.total },
          { label: 'Sent', value: stats.sent },
          { label: 'Delivered', value: stats.delivered },
          { label: 'Read', value: stats.read },
          { label: 'Verified', value: stats.verified },
          { label: 'Failed', value: stats.failed, emphasis: stats.failed > 0 ? 'destructive' : 'default' },
          { label: 'Verified %', value: `${stats.verificationRate}%` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Codes over time — last 30 days</h3>
          <AreaChart
            data={stats.byDay as unknown as Record<string, unknown>[]}
            config={TREND_CONFIG}
            xAxisKey="date"
            areas={[
              { dataKey: 'sent' },
              { dataKey: 'delivered' },
              { dataKey: 'read' },
              { dataKey: 'verified' },
              { dataKey: 'failed' },
            ]}
          />
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">By status</h3>
          <PieChart data={statusData} config={STATUS_CONFIG} dataKey="count" nameKey="status" />
        </Card>
      </div>
    </div>
  );
};
