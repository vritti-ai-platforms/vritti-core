import type React from 'react';

interface TipRowProps {
  label: string;
  value: React.ReactNode;
}

// One label–value line of a stock level bar tooltip
export const TipRow: React.FC<TipRowProps> = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="opacity-70">{label}</span>
    <span>{value}</span>
  </div>
);
