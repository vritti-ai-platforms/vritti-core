import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { cn } from '@vritti/quantum-ui/cn';
import { Field, FieldDescription, FieldError, FieldLabel } from '@vritti/quantum-ui/Field';
import { Star } from 'lucide-react';
import { forwardRef } from 'react';
import type { PartyFunctionAssignment, PartyFunctionOption } from '@/schemas/party-functions';

interface FunctionsEditorProps {
  name?: string;
  label?: string;
  description?: string;
  options: PartyFunctionOption[];
  value?: PartyFunctionAssignment[];
  onChange?: (value: PartyFunctionAssignment[]) => void;
  error?: string;
}

export const FunctionsEditor = forwardRef<HTMLDivElement, FunctionsEditorProps>(
  ({ label, description, options, value, onChange, error }, ref) => {
    const assigned = value ?? [];

    const setAssigned = (fn: string, next: boolean) => {
      if (next) {
        if (!assigned.some((item) => item.function === fn)) {
          onChange?.([...assigned, { function: fn, isPrimary: false }]);
        }
      } else {
        onChange?.(assigned.filter((item) => item.function !== fn));
      }
    };

    const togglePrimary = (fn: string) => {
      onChange?.(assigned.map((item) => (item.function === fn ? { ...item, isPrimary: !item.isPrimary } : item)));
    };

    return (
      <Field ref={ref}>
        {label && <FieldLabel>{label}</FieldLabel>}
        {description && !error && <FieldDescription>{description}</FieldDescription>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const current = assigned.find((item) => item.function === option.value);
            const checked = !!current;
            const isPrimary = !!current?.isPrimary;
            return (
              <div
                key={option.value}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                  checked ? 'border-primary/50 bg-primary/4' : 'border-border',
                )}
              >
                <Checkbox
                  label={option.label}
                  checked={checked}
                  onCheckedChange={(next) => setAssigned(option.value, next === true)}
                />
                {checked && (
                  <button
                    type="button"
                    aria-label={isPrimary ? `Unset ${option.label} as primary` : `Set ${option.label} as primary`}
                    onClick={() => togglePrimary(option.value)}
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors',
                      isPrimary ? 'text-warning' : 'text-muted-foreground/50 hover:bg-warning/10 hover:text-warning',
                    )}
                  >
                    <Star className={cn('size-3.5', isPrimary && 'fill-current')} />
                    {isPrimary && <span>Primary</span>}
                  </button>
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

FunctionsEditor.displayName = 'FunctionsEditor';
