import { Progress } from '@vritti/quantum-ui/Progress';
import { Typography } from '@vritti/quantum-ui/Typography';

interface PurchaseCoverageProps {
  percent: number;
  caption: string;
  // Centred inside a table cell; left beside other content
  align?: 'left' | 'center';
}

// A coverage bar with what it measures underneath
export const PurchaseCoverage = ({ percent, caption, align = 'left' }: PurchaseCoverageProps) => (
  <div className="flex min-w-32 flex-col gap-1.5">
    <Progress value={percent} className="h-1.5" />
    <Typography variant="caption" intent="muted" align={align}>
      {caption}
    </Typography>
  </div>
);
