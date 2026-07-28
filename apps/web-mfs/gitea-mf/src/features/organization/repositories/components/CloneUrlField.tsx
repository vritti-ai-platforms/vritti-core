import { Button } from '@vritti/quantum-ui/Button';
import { toast } from '@vritti/quantum-ui/Sonner';
import { Check, Copy } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

interface CloneUrlFieldProps {
  label: string;
  url: string;
}

// A read-only URL with a copy affordance. Clone URLs exist to be pasted into a terminal, so
// selecting the text by hand is the wrong interaction.
export const CloneUrlField: React.FC<CloneUrlFieldProps> = ({ label, url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Could not copy to the clipboard.'));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
          {url}
        </code>
        <Button variant="outline" size="icon" aria-label={`Copy ${label} clone URL`} onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
};
