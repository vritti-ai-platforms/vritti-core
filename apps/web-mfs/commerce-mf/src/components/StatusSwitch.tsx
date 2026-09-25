import { cn } from '@vritti/quantum-ui/cn';
import { CompactSwitch } from '@vritti/quantum-ui/Switch';
import type React from 'react';

interface StatusSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  permission?: string;
  disabled?: boolean;
  disabledTip?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusSwitch: React.FC<StatusSwitchProps> = ({
  checked,
  onCheckedChange,
  ariaLabel,
  permission,
  disabled,
  disabledTip,
  activeLabel = 'Active',
  inactiveLabel = 'Draft',
  size = 'sm',
}) => (
  <div
    className={cn(
      'inline-flex items-center gap-2 rounded-full border border-dotted py-1 pr-1.5 pl-2.5 transition-colors duration-200',
      checked ? 'border-success/40 bg-success/10' : 'border-border bg-transparent',
      disabled && 'opacity-60',
    )}
  >
    <span aria-hidden className="grid justify-items-end">
      {[inactiveLabel, activeLabel].map((label, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed pair of slots, not a reorderable list
          key={index}
          className={cn(
            'col-start-1 row-start-1 select-none font-semibold uppercase leading-none tracking-[0.08em] transition-all duration-200',
            size === 'sm' ? 'text-[10px]' : 'text-[11px]',
            checked === (index === 1) ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
            index === 1 ? 'text-success' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      ))}
    </span>
    <CompactSwitch
      size="sm"
      checked={checked}
      permission={permission}
      disabled={disabled}
      disabledTip={disabledTip}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
    />
  </div>
);
