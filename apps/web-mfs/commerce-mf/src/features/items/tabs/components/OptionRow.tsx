import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Trash2, X } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import type { OptionDraft } from '../../hooks/useOptionsDraft';

interface OptionRowProps {
  index: number;
  option: OptionDraft;
  onUpdateName: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onAddValue: (index: number, value: string) => void;
  onRemoveValue: (optionIndex: number, valueIndex: number) => void;
}

export const OptionRow: React.FC<OptionRowProps> = ({
  index,
  option,
  onUpdateName,
  onRemove,
  onAddValue,
  onRemoveValue,
}) => {
  const [newValue, setNewValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (!newValue.trim()) return;
    onAddValue(index, newValue);
    setNewValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="grid grid-cols-[180px_1fr_auto] items-start gap-3 rounded-md border bg-card p-3">
      <TextField
        value={option.name}
        onChange={(e) => onUpdateName(index, e.target.value)}
        placeholder="Option name"
        className="h-9 text-sm"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {option.values.map((value, vi) => (
          <Badge
            key={`${value}-${vi}`}
            variant="secondary"
            className="flex items-center gap-1 py-1 pl-2 pr-1 font-normal"
          >
            <span>{value}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveValue(index, vi)}
              className="size-4 rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
              aria-label={`Remove ${value}`}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        ))}
        <div className="flex items-center gap-1">
          <TextField
            ref={inputRef}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            placeholder="Add value"
            className="h-8 w-32 px-2"
          />
          <Button variant="ghost" size="sm" onClick={commit} disabled={!newValue.trim()} className="h-8 px-2">
            Add
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)}
        aria-label="Remove option"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
};
