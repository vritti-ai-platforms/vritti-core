import { Badge } from '@vritti/quantum-ui/Badge';
import type React from 'react';
import { MESSAGING_APP_LABELS, type PartyCommunicationApp } from '@/schemas/party-communications';

interface AppChipsProps {
  apps: PartyCommunicationApp[];
}

export const AppChips: React.FC<AppChipsProps> = ({ apps }) => {
  if (!apps.length) return <span className="text-muted-foreground/60">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {apps.map((item) => (
        <Badge key={item.app} variant="secondary">
          {MESSAGING_APP_LABELS[item.app]}
          {item.handle ? <span className="text-muted-foreground"> · {item.handle}</span> : null}
        </Badge>
      ))}
    </div>
  );
};
