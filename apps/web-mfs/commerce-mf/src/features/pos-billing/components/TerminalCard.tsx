import { cn } from '@vritti/quantum-ui';
import { Button } from '@vritti/quantum-ui/Button';
import { Card } from '@vritti/quantum-ui/Card';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowRight, Monitor } from 'lucide-react';
import type React from 'react';
import type { PosTerminalData } from '@/schemas/pos-terminals';

interface TerminalCardProps {
  terminal: PosTerminalData;
  onClick: () => void;
}

export const TerminalCard: React.FC<TerminalCardProps> = ({ terminal, onClick }) => {
  const disabled = !terminal.isActive;

  const handleClick = () => {
    if (!disabled) onClick();
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'h-72 p-0 overflow-hidden flex flex-col',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md transition-shadow',
      )}
    >
      <div className="h-40 w-full bg-muted flex items-center justify-center shrink-0">
        <Monitor className="size-10 text-muted-foreground" />
      </div>

      <div className="flex-1 p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'size-1.5 rounded-full',
              terminal.isActive ? 'bg-success' : 'bg-muted-foreground/40',
            )}
            aria-hidden
          />
          <Typography variant="subtitle2" className="leading-snug truncate">
            {terminal.name}
          </Typography>
        </div>
        <Typography variant="caption" className="truncate min-h-4">
          {terminal.code}
        </Typography>
        <div className="mt-auto flex items-center justify-between gap-2">
          <Typography variant="caption">{terminal.isActive ? 'Active' : 'Inactive'}</Typography>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-primary hover:bg-primary/10"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            aria-label={`Open ${terminal.name}`}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
