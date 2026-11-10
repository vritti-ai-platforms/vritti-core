import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { cn } from '@vritti/quantum-ui/cn';
import { Field, FieldDescription, FieldError, FieldLabel } from '@vritti/quantum-ui/Field';
import { forwardRef } from 'react';
import type { CommunicationApp, MessagingApp } from '@/schemas/party-communications';

interface AppOption {
  value: MessagingApp;
  label: string;
}

interface AppsEditorProps {
  name?: string;
  label?: string;
  description?: string;
  options: AppOption[];
  value?: CommunicationApp[];
  onChange?: (value: CommunicationApp[]) => void;
  error?: string;
}

export const AppsEditor = forwardRef<HTMLDivElement, AppsEditorProps>(
  ({ label, description, options, value, onChange, error }, ref) => {
    const assigned = value ?? [];

    const setAssigned = (app: MessagingApp, next: boolean) => {
      if (next) {
        if (!assigned.some((item) => item.app === app)) {
          onChange?.([...assigned, { app, handle: null }]);
        }
      } else {
        onChange?.(assigned.filter((item) => item.app !== app));
      }
    };

    const setHandle = (app: MessagingApp, handle: string) => {
      onChange?.(assigned.map((item) => (item.app === app ? { ...item, handle: handle || null } : item)));
    };

    return (
      <Field ref={ref}>
        {label && <FieldLabel>{label}</FieldLabel>}
        {description && !error && <FieldDescription>{description}</FieldDescription>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const current = assigned.find((item) => item.app === option.value);
            const checked = !!current;
            return (
              <div
                key={option.value}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors',
                  checked ? 'border-primary/50 bg-primary/4' : 'border-border',
                )}
              >
                <Checkbox
                  label={option.label}
                  checked={checked}
                  onCheckedChange={(next) => setAssigned(option.value, next === true)}
                />
                {checked && (
                  <input
                    type="text"
                    value={current?.handle ?? ''}
                    onChange={(e) => setHandle(option.value, e.target.value)}
                    placeholder="Same as number (or @handle)"
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                )}
              </div>
            );
          })}
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  },
);

AppsEditor.displayName = 'AppsEditor';
