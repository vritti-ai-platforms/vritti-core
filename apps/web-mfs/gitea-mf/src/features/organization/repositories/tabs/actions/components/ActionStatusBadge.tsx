import { Badge } from '@vritti/quantum-ui/Badge';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import type React from 'react';
import { resolveActionStatus } from '../utils/actions';

interface ActionStatusBadgeProps {
  status: string;
  conclusion: string | null;
  className?: string;
}

// One badge for runs, jobs and steps — they share Gitea's status/conclusion vocabulary
export const ActionStatusBadge: React.FC<ActionStatusBadgeProps> = ({ status, conclusion, className }) => {
  const { label, variant, Icon, spin } = resolveActionStatus(status, conclusion);

  return (
    <Badge variant={variant} className={className}>
      {spin ? <Spinner /> : <Icon />}
      {label}
    </Badge>
  );
};
