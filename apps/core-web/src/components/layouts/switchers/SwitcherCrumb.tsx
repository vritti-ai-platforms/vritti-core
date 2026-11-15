import { Button, type ButtonProps } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import { ChevronsUpDown, type LucideIcon } from 'lucide-react';
import type React from 'react';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

interface SwitcherCrumbProps {
  icon: LucideIcon;
  label: string;
  // The detail page the crumb names
  to: string;
  // Sets the name in monospace, for a code
  mono?: boolean;
  // The selector, anchored on a SwitcherTrigger
  children: React.ReactNode;
}

// A detail crumb in the top bar: its name links to the detail page, and the switcher beside it opens the list to switch
export const SwitcherCrumb: React.FC<SwitcherCrumbProps> = ({ icon: Icon, label, to, mono, children }) => (
  <span className="flex min-w-25 items-center gap-1.5 text-sm">
    <Link
      to={to}
      className="flex items-center gap-1.5 text-foreground underline-offset-4 transition-colors hover:underline"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn(mono && 'font-mono')}>{label}</span>
    </Link>
    <span className="shrink-0">{children}</span>
  </span>
);

// The round chevron that opens a switcher's list; the selector's anchor, so it takes the popover trigger's props
export const SwitcherTrigger = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'children'> & { label: string }>(
  ({ label, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      aria-label={label}
      className="size-6 rounded-full border border-border hover:bg-accent"
      {...props}
    >
      <ChevronsUpDown className="size-3.5 text-muted-foreground" />
    </Button>
  ),
);
SwitcherTrigger.displayName = 'SwitcherTrigger';
