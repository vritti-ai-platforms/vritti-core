import { cn } from '@vritti/quantum-ui/cn';

interface TemplatePreviewProps {
  header?: string | null;
  body?: string | null;
  footer?: string | null;
  buttons?: string[];
  className?: string;
}

// WhatsApp-style message bubble. Pure presentational — callers substitute {{n}} variables with
// example values before passing the body. Reused by the library gallery, the library config step,
// and the custom editor's live pane.
export const TemplatePreview = ({ header, body, footer, buttons = [], className }: TemplatePreviewProps) => (
  <div className={cn('w-full max-w-sm rounded-lg border bg-card p-3 text-left shadow-sm', className)}>
    {header?.trim() && <p className="mb-1 font-semibold text-sm">{header}</p>}
    <p className="whitespace-pre-wrap text-sm">{body?.trim() ? body : 'Message text appears here…'}</p>
    {footer?.trim() && <p className="mt-1 text-muted-foreground text-xs">{footer}</p>}
    {buttons.length > 0 && (
      <div className="mt-2 flex flex-col divide-y border-t">
        {buttons.map((label) => (
          <span key={label} className="py-1.5 text-center font-medium text-primary text-sm">
            {label}
          </span>
        ))}
      </div>
    )}
  </div>
);
