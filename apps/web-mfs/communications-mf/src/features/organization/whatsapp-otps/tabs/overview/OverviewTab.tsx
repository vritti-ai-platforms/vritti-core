import { AreaChart } from '@vritti/quantum-ui/AreaChart';
import { Card } from '@vritti/quantum-ui/Card';
import { useChart } from '@vritti/quantum-ui/Chart';
import { PieChart } from '@vritti/quantum-ui/PieChart';
import { useWhatsappOtpStats } from '@/hooks/organization/whatsapp-otps';
import type { WhatsappOtpStatsData } from '@/schemas/whatsapp-otps';
import { StatStrip } from '../../components/StatStrip';
import { OverviewTabSkeleton } from './OverviewTabSkeleton';

// The charts and the tiles run in lifecycle order — sent → delivered → read → verified, then failed. Each series is a status, coloured by
// semantic token rather than the chart palette so it matches the badge the same row carries in the Codes tab
const STATUS_SERIES = [
  { id: 'sent', label: 'Sent', color: 'var(--color-muted-foreground)' },
  { id: 'delivered', label: 'Delivered', color: 'var(--color-info)' },
  { id: 'read', label: 'Read', color: 'var(--color-primary)' },
  { id: 'verified', label: 'Verified', color: 'var(--color-success)' },
  { id: 'failed', label: 'Failed', color: 'var(--color-destructive)' },
];

const selectTrend = (stats: WhatsappOtpStatsData) => ({
  rows: stats.byDay.map((day) => ({ ...day })),
  series: STATUS_SERIES,
});

const selectStatuses = (stats: WhatsappOtpStatsData) => ({
  rows: [
    { status: 'sent', count: stats.sent },
    { status: 'delivered', count: stats.delivered },
    { status: 'read', count: stats.read },
    { status: 'verified', count: stats.verified },
    { status: 'failed', count: stats.failed },
  ],
  series: STATUS_SERIES,
});

export const OverviewTab = () => {
  const statsQuery = useWhatsappOtpStats();
  const trend = useChart({ data: statsQuery.data, select: selectTrend });
  const statuses = useChart({ data: statsQuery.data, select: selectStatuses });
  const { data: stats, isLoading } = statsQuery;

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
          <AreaChart chart={trend} xAxisKey="date" mode="compact" className="h-75 border-0 p-0" />
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">By status</h3>
          <PieChart chart={statuses} dataKey="count" nameKey="status" mode="compact" className="h-75 border-0 p-0" />
        </Card>
      </div>
    </div>
  );
};
