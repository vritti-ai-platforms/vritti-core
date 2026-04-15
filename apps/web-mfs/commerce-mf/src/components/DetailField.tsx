import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';

interface DetailFieldProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

export const DetailField: React.FC<DetailFieldProps> = ({ label, value, className }) => {
  return (
    <div className={className}>
      <Typography variant="overline" intent="muted" className="mb-1">
        {label}
      </Typography>
      <Typography variant="body2" className="font-medium">
        {value}
      </Typography>
    </div>
  );
};
